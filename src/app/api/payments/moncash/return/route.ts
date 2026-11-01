import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { interpretMonCashPayment, retrieveByTransactionId } from "@/lib/payments/moncash";
import { applyVerification, confirmationUrl } from "@/lib/donations";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/request";

export const runtime = "nodejs";

/**
 * URL de retour MonCash (à déclarer dans le portail marchand).
 * MonCash ajoute ?transactionId=… ; on interroge l'API MonCash côté serveur avant toute mise à jour.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const transactionId = url.searchParams.get("transactionId") ?? url.searchParams.get("transactionid");
  const fallback = NextResponse.redirect(`${env.appUrl()}/faire-un-don`);
  if (!transactionId || !/^[\w-]{4,64}$/.test(transactionId)) return fallback;
  if (!(await rateLimit(`moncash-return:${ipFromRequest(req)}`, 20, 10 * 60 * 1000)).ok) return new Response("Trop de requêtes", { status: 429 });

  try {
    const data = await retrieveByTransactionId(transactionId);
    const reference = data.payment?.reference;
    if (!reference) return fallback;
    const donation = await prisma.donation.findFirst({ where: { reference, provider: "moncash" } });
    if (!donation) return fallback;
    await prisma.paymentEvent
      .create({ data: { provider: "moncash", eventId: `return:${transactionId}`, type: "return.verified", donationId: donation.id, payload: data as Prisma.InputJsonValue } })
      .catch(() => null);
    await applyVerification(donation, interpretMonCashPayment(donation, data), "moncash:return");
    return NextResponse.redirect(confirmationUrl(donation));
  } catch (err) {
    console.error("[moncash:return] vérification impossible", err);
    return fallback;
  }
}
