import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { receiptPdfFor } from "@/lib/donations";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Téléchargement du reçu : par le donateur (jeton secret) ou par un administrateur autorisé. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const d = await prisma.donation.findUnique({ where: { reference: ref } });
  if (!d) return new Response("Introuvable", { status: 404 });

  let allowed = false;
  if (token && token.length === d.accessToken.length) allowed = timingSafeEqual(Buffer.from(token), Buffer.from(d.accessToken));
  if (!allowed) {
    const user = await getCurrentUser();
    if (user && can(user.role, "donations.view")) {
      allowed = true;
      await audit(user.id, "donation.receipt.download", "Donation", d.id);
    }
  }
  if (!allowed) return new Response("Introuvable", { status: 404 });
  if (d.status !== "CONFIRMED" || !d.receiptNumber) return new Response("Reçu disponible après confirmation du paiement", { status: 409 });

  const pdf = await receiptPdfFor(d);
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${d.receiptNumber}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
