import { timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { interpretMonCashPayment, retrieveByTransactionId } from "@/lib/payments/moncash";
import { applyVerification } from "@/lib/donations";

export const runtime = "nodejs";

/**
 * Notification MonCash (« Alert URL »). MonCash ne signe pas ses notifications : on exige une clé
 * secrète partagée dans l'URL ET on ne fait jamais confiance au contenu — il ne sert qu'à déclencher
 * une re-vérification auprès de l'API MonCash.
 */
export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const expected = env.moncash().notifyKey;
  if (!expected || key.length !== expected.length || !timingSafeEqual(Buffer.from(key), Buffer.from(expected))) {
    return new Response("Non autorisé", { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const transactionId = String(body.transactionId ?? body.transaction_id ?? body.transNumber ?? "");
  if (!/^[\w-]{4,64}$/.test(transactionId)) return new Response("Requête invalide", { status: 400 });

  const data = await retrieveByTransactionId(transactionId);
  const reference = data.payment?.reference;
  const donation = reference ? await prisma.donation.findFirst({ where: { reference, provider: "moncash" } }) : null;
  try {
    await prisma.paymentEvent.create({
      data: { provider: "moncash", eventId: `notify:${transactionId}`, type: "notify.verified", donationId: donation?.id, payload: data as Prisma.InputJsonValue },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return Response.json({ received: true, duplicate: true });
    throw e;
  }
  if (donation) await applyVerification(donation, interpretMonCashPayment(donation, data), "moncash:notify");
  return Response.json({ received: true });
}
