"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasDatabase, prisma } from "@/lib/db";
import { getDictionary, LOCALES, LOCALE_COOKIE } from "@/lib/i18n";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { looksLikeSpam } from "@/lib/antispam";
import { checkbox, fieldErrors, optionalText, phoneSchema, type FormState } from "@/lib/forms";
import { getSetting } from "@/lib/settings";
import { sendMail, mailLayout } from "@/lib/mail";
import { env } from "@/lib/env";
import { COUNTRY_CODES } from "@/lib/countries";
import { methodStatuses, PROVIDERS } from "@/lib/payments";
import { confirmationUrl, generateAccessToken, generateReference, transitionDonation } from "@/lib/donations";

const WINDOW = 10 * 60 * 1000;

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale"));
  const back = String(formData.get("path") ?? "/");
  if ((LOCALES as readonly string[]).includes(locale)) {
    (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/");
}

async function guard(fd: FormData, bucket: string, limit = 5): Promise<FormState | null> {
  const { t } = await getDictionary();
  if (!hasDatabase()) return { ok: false, message: t.common.errorGeneric };
  if (looksLikeSpam(fd)) return { ok: true, message: t.common.sending }; // réponse neutre aux robots
  const ip = await getClientIp();
  const { ok } = await rateLimit(`form:${bucket}:${ip}`, limit, WINDOW);
  if (!ok) return { ok: false, message: t.common.tooMany };
  return null;
}

async function notifyTeam(subject: string, lines: string[]) {
  const contact = await getSetting("contact");
  const to = contact.notifyEmail || contact.email;
  if (to) await sendMail({ to, subject, text: lines.join("\n") });
}

// ──────────────────────────────── Contact

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: phoneSchema,
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
  consent: checkbox.refine((v) => v, "Consentement requis"),
});

export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "contact");
  if (blocked) return blocked;
  const { t } = await getDictionary();
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: t.common.invalid, errors: fieldErrors(parsed.error) };
  const { consent: _c, ...data } = parsed.data;
  await prisma.contactMessage.create({ data: { ...data, consentAt: new Date() } });
  await notifyTeam(`[Contact] ${data.subject}`, [`De : ${data.name} <${data.email}>`, data.phone ?? "", "", data.message]);
  return { ok: true, message: t.contact.success };
}

// ──────────────────────────────── Bénévolat

const INTERESTS = ["terrain", "events", "communication", "logistics", "observation", "expertise"] as const;
const volunteerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: phoneSchema,
  city: z.string().trim().min(2).max(120),
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
  availability: optionalText(300),
  message: optionalText(2000),
  consent: checkbox.refine((v) => v, "Consentement requis"),
});

export async function submitVolunteer(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "volunteer");
  if (blocked) return blocked;
  const { t } = await getDictionary();
  const parsed = volunteerSchema.safeParse({ ...Object.fromEntries(fd), interests: fd.getAll("interests") });
  if (!parsed.success) return { ok: false, message: t.common.invalid, errors: fieldErrors(parsed.error) };
  const { consent: _c, ...data } = parsed.data;
  await prisma.volunteer.create({ data: { ...data, consentAt: new Date() } });
  await notifyTeam(`[Bénévolat] ${data.firstName} ${data.lastName} — ${data.city}`, [data.email, data.phone ?? "", data.interests.join(", ")]);
  return { ok: true, message: t.volunteer.success };
}

// ──────────────────────────────── Newsletter (double opt-in)

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  consent: checkbox.refine((v) => v, "Consentement requis"),
});

export async function subscribeNewsletter(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "newsletter");
  if (blocked) return blocked;
  const { t, locale } = await getDictionary();
  const parsed = newsletterSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: t.common.invalid, errors: fieldErrors(parsed.error) };
  const { email } = parsed.data;
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  // Réponse identique dans tous les cas pour ne pas révéler l'existence d'une inscription.
  if (existing?.status === "CONFIRMED") return { ok: true, message: t.newsletter.success };
  const token = randomBytes(24).toString("base64url");
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, locale, token, consentAt: new Date() },
    update: { token, locale, status: "PENDING", consentAt: new Date() },
  });
  const site = await getSetting("site");
  const url = `${env.appUrl()}/newsletter/confirmer?token=${token}`;
  await sendMail({
    to: email,
    subject: `Confirmez votre inscription — ${site.campaignName}`,
    text: `Pour confirmer votre inscription à la newsletter, ouvrez ce lien : ${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    html: mailLayout("Confirmez votre inscription", ["Merci de votre intérêt pour la campagne.", "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."], {
      label: "Confirmer mon inscription",
      url,
    }),
  });
  return { ok: true, message: t.newsletter.success };
}

// ──────────────────────────────── Inscription aux événements

const registrationSchema = z.object({
  eventId: z.string().min(1).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: phoneSchema,
  guests: z.coerce.number().int().min(0).max(10).default(0),
  consent: checkbox.refine((v) => v, "Consentement requis"),
});

export async function registerForEvent(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "event", 10);
  if (blocked) return blocked;
  const { t } = await getDictionary();
  const parsed = registrationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: t.common.invalid, errors: fieldErrors(parsed.error) };
  const { consent: _c, eventId, ...data } = parsed.data;
  const event = await prisma.event.findFirst({ where: { id: eventId, published: true } });
  if (!event || !event.registrationEnabled || event.startsAt < new Date()) return { ok: false, message: t.agenda.registrationClosed };
  try {
    await prisma.$transaction(async (tx) => {
      if (event.capacity) {
        const agg = await tx.eventRegistration.aggregate({ where: { eventId }, _count: true, _sum: { guests: true } });
        const taken = agg._count + (agg._sum.guests ?? 0);
        if (taken + 1 + data.guests > event.capacity) throw new Error("FULL");
      }
      await tx.eventRegistration.create({ data: { ...data, eventId, consentAt: new Date() } });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FULL") return { ok: false, message: t.agenda.full };
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") return { ok: true, message: t.agenda.alreadyRegistered };
    throw e;
  }
  return { ok: true, message: t.agenda.registered };
}

// ──────────────────────────────── Dons

const donationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: phoneSchema,
  country: z.enum(COUNTRY_CODES as [string, ...string[]]),
  amount: z.preprocess((v) => String(v ?? "").replace(/[\s ,]/g, ""), z.string().regex(/^\d{1,9}$/)).transform(Number),
  method: z.enum(["CARD", "MONCASH", "BANK_TRANSFER"]),
  terms: checkbox.refine((v) => v, "Vous devez accepter les conditions"),
});

export async function submitDonation(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd, "donation", 8);
  if (blocked) return blocked;
  const { t, locale } = await getDictionary();
  const [cfg, compliance, legal] = await Promise.all([getSetting("donations"), getSetting("compliance"), getSetting("legal")]);

  const raw = Object.fromEntries(fd);
  if (raw.amount === "custom") raw.amount = raw.customAmount ?? "";
  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: t.common.invalid, errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const status = methodStatuses(cfg, compliance).find((m) => m.method === d.method);
  if (!status?.available) return { ok: false, message: t.donate.noMethod, errors: { method: t.donate.noMethod } };

  const errors: Record<string, string> = {};
  if (d.amount < cfg.minAmount) errors.amount = `${t.donate.amountMin} : ${cfg.minAmount} HTG`;
  if (d.amount > cfg.maxAmount) errors.amount = t.donate.capExceeded;
  const allowed = cfg.allowedCountries.map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(d.country)) errors.country = t.donate.foreignNotAllowed;
  const attestations: Record<string, boolean> = {};
  for (const a of cfg.attestations) {
    attestations[a.id] = fd.get(`attest_${a.id}`) === "on";
    if (!attestations[a.id]) errors[`attest_${a.id}`] = t.common.required;
  }
  if (Object.keys(errors).length) return { ok: false, message: t.common.invalid, errors };

  const amountCents = d.amount * 100;
  if (cfg.maxPerDonor > 0) {
    const agg = await prisma.donation.aggregate({
      where: {
        email: d.email,
        OR: [{ status: "CONFIRMED" }, { status: "PENDING", createdAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) } }],
      },
      _sum: { amountCents: true },
    });
    if ((agg._sum.amountCents ?? 0) + amountCents > cfg.maxPerDonor * 100) {
      return { ok: false, message: t.donate.capExceeded, errors: { amount: t.donate.capExceeded } };
    }
  }

  const provider = PROVIDERS[d.method];
  const donation = await prisma.donation.create({
    data: {
      reference: generateReference(),
      accessToken: generateAccessToken(),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      country: d.country,
      amountCents,
      currency: "HTG",
      method: d.method,
      provider: provider.id,
      attestations,
      termsVersion: legal.termsVersion,
      termsAcceptedAt: new Date(),
      locale,
    },
  });

  let target: string;
  try {
    const result = await provider.createPayment(donation, {
      returnUrl: confirmationUrl(donation),
      cancelUrl: confirmationUrl(donation, "&annule=1"),
    });
    if (result.kind === "redirect") {
      await prisma.donation.update({ where: { id: donation.id }, data: { providerRef: result.providerRef } });
      target = result.url;
    } else {
      target = confirmationUrl(donation);
      await sendBankInstructions(donation.id);
    }
  } catch (err) {
    console.error(`[dons] initialisation impossible (${donation.reference})`, err);
    await transitionDonation(donation.id, "FAILED", { failureReason: "Initialisation du paiement impossible" });
    return { ok: false, message: t.donate.providerError };
  }
  redirect(target);
}

async function sendBankInstructions(donationId: string) {
  const d = await prisma.donation.findUniqueOrThrow({ where: { id: donationId } });
  const cfg = await getSetting("donations");
  const site = await getSetting("site");
  const lines = [
    `Bonjour ${d.firstName},`,
    `Merci pour votre intention de contribution de ${(d.amountCents / 100).toLocaleString("fr-FR")} HTG.`,
    `Banque : ${cfg.bankName} — Titulaire : ${cfg.bankAccountName} — Compte : ${cfg.bankAccountNumber}${cfg.bankSwift ? ` — SWIFT : ${cfg.bankSwift}` : ""}`,
    `Référence à indiquer impérativement : ${d.reference}`,
    "Votre contribution sera confirmée et votre reçu envoyé après réception et rapprochement du virement.",
  ];
  await sendMail({
    to: d.email,
    subject: `Instructions de virement — ${d.reference} — ${site.campaignName}`,
    text: lines.join("\n\n"),
    html: mailLayout("Instructions de virement", lines, { label: "Suivre ma contribution", url: confirmationUrl(d) }),
  });
}
