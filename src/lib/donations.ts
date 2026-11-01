import "server-only";
import { randomBytes } from "node:crypto";
import type { Donation, DonationStatus, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";
import { getSetting } from "./settings";
import { sendMail, mailLayout } from "./mail";
import { buildReceiptPdf } from "./receipt";
import { formatMoney } from "./utils";
import { sourcesFor } from "./donation-status";
import { PROVIDERS } from "./payments";
import type { VerificationResult } from "./payments/types";
import { rateLimit } from "./rate-limit";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus

export function generateReference(now = new Date()): string {
  const bytes = randomBytes(8);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `DON-${now.getFullYear()}-${code}`;
}

export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function confirmationUrl(d: Pick<Donation, "reference" | "accessToken">, extra = "") {
  return `${env.appUrl()}/faire-un-don/confirmation?ref=${encodeURIComponent(d.reference)}&token=${encodeURIComponent(d.accessToken)}${extra}`;
}

/**
 * Applique une transition de statut de manière atomique et idempotente :
 * la mise à jour n'a lieu que si le statut actuel autorise la transition.
 */
export async function transitionDonation(
  id: string,
  to: DonationStatus,
  data: Prisma.DonationUpdateManyMutationInput = {},
  tx: Prisma.TransactionClient = prisma,
): Promise<boolean> {
  const res = await tx.donation.updateMany({ where: { id, status: { in: sourcesFor(to) } }, data: { ...data, status: to } });
  return res.count === 1;
}

/** Confirme un don après vérification serveur. Contrôle le montant et la devise. */
export async function confirmDonation(
  donation: Donation,
  proof: { providerPaymentId: string; amountCents: number; currency: string },
  source: string,
): Promise<boolean> {
  if (proof.amountCents !== donation.amountCents || proof.currency.toUpperCase() !== donation.currency.toUpperCase()) {
    await transitionDonation(donation.id, "FAILED", {
      failureReason: `Montant/devise incohérents (${proof.amountCents} ${proof.currency}) — à examiner`,
    });
    console.error(`[dons] incohérence de montant pour ${donation.reference} (source: ${source})`);
    return false;
  }
  const ok = await prisma.$transaction(async (tx) => {
    const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('receipt_number_seq')`;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(nextval).padStart(6, "0")}`;
    return transitionDonation(
      donation.id,
      "CONFIRMED",
      { providerPaymentId: proof.providerPaymentId, confirmedAt: new Date(), receiptNumber, failureReason: null },
      tx,
    );
  });
  if (ok) await sendReceiptEmail(donation.id).catch((e) => console.error("[dons] reçu non envoyé", e));
  return ok;
}

export async function applyVerification(donation: Donation, result: VerificationResult, source: string) {
  if (result.status === "CONFIRMED") return confirmDonation(donation, result, source);
  if (result.status === "FAILED") return transitionDonation(donation.id, "FAILED", { failureReason: result.reason });
  if (result.status === "CANCELLED") return transitionDonation(donation.id, "CANCELLED", { failureReason: result.reason });
  return false;
}

/** Re-vérifie un don en attente auprès du prestataire (limité pour ne pas surcharger l'API). */
export async function syncWithProvider(donation: Donation): Promise<Donation> {
  if (donation.status !== "PENDING") return donation;
  const provider = PROVIDERS[donation.method];
  if (!provider.verify || !provider.isConfigured()) return donation;
  const { ok } = await rateLimit(`sync:${donation.id}`, 1, 5000);
  if (!ok) return donation;
  try {
    const result = await provider.verify(donation);
    await applyVerification(donation, result, "sync");
  } catch (err) {
    console.error(`[dons] vérification impossible pour ${donation.reference}`, err);
  }
  return (await prisma.donation.findUnique({ where: { id: donation.id } })) ?? donation;
}

export async function receiptPdfFor(d: Donation) {
  const site = await getSetting("site");
  return buildReceiptPdf(d, { campaignName: site.campaignName, legalEntity: site.legalEntity });
}

export async function sendReceiptEmail(donationId: string) {
  const d = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!d || d.status !== "CONFIRMED") return false;
  const site = await getSetting("site");
  const pdf = await receiptPdfFor(d);
  const amount = formatMoney(d.amountCents, d.currency);
  const sent = await sendMail({
    to: d.email,
    subject: `Reçu de votre contribution ${d.receiptNumber} — ${site.campaignName}`,
    text: `Bonjour ${d.firstName},\n\nNous vous remercions pour votre contribution de ${amount}, confirmée sous la référence ${d.reference}.\nVotre reçu ${d.receiptNumber} est joint à ce message.\n\nSuivi : ${confirmationUrl(d)}\n\n${site.campaignName}`,
    html: mailLayout(
      "Merci pour votre contribution",
      [
        `Bonjour ${d.firstName},`,
        `Nous vous remercions pour votre contribution de ${amount}, confirmée sous la référence ${d.reference}.`,
        `Votre reçu ${d.receiptNumber} est joint à ce message.`,
      ],
      { label: "Consulter ma contribution", url: confirmationUrl(d) },
    ),
    attachments: [{ filename: `${d.receiptNumber}.pdf`, content: Buffer.from(pdf), contentType: "application/pdf" }],
  });
  if (sent) await prisma.donation.update({ where: { id: d.id }, data: { receiptSentAt: new Date() } });
  return sent;
}

/** Statistiques financières : calculées exclusivement à partir des dons CONFIRMÉS. */
export async function confirmedDonationStats(where: Prisma.DonationWhereInput = {}) {
  const agg = await prisma.donation.aggregate({
    where: { ...where, status: "CONFIRMED" },
    _sum: { amountCents: true },
    _count: true,
    _avg: { amountCents: true },
  });
  return { count: agg._count, totalCents: agg._sum.amountCents ?? 0, averageCents: Math.round(agg._avg.amountCents ?? 0) };
}
