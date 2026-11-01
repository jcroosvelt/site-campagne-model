import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { constructStripeEvent, interpretCheckoutSession } from "@/lib/payments/stripe";
import { applyVerification, transitionDonation } from "@/lib/donations";

export const runtime = "nodejs";

/**
 * Webhook Stripe — seule source de vérité pour les paiements par carte.
 * La signature (en-tête Stripe-Signature) est vérifiée sur le corps BRUT de la requête.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = constructStripeEvent(raw, req.headers.get("stripe-signature"));
  } catch (err) {
    console.warn("[webhook:stripe] signature invalide", (err as Error).message);
    return new Response("Signature invalide", { status: 400 });
  }

  // Idempotence : un même événement n'est traité qu'une fois.
  const obj = event.data.object as { metadata?: Record<string, string> | null };
  const donationId = obj.metadata?.donationId ?? null;
  try {
    await prisma.paymentEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        type: event.type,
        donationId: donationId && (await prisma.donation.count({ where: { id: donationId } })) ? donationId : null,
        payload: { id: event.id, type: event.type, created: event.created, object: (event.data.object as { id?: string }).id ?? null } as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return Response.json({ received: true, duplicate: true });
    throw e;
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const donation = await prisma.donation.findFirst({ where: { providerRef: session.id, provider: "stripe" } });
      if (!donation || session.metadata?.reference !== donation.reference) break;
      await applyVerification(donation, interpretCheckoutSession(session), `webhook:${event.type}`);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const donation = await prisma.donation.findFirst({ where: { providerRef: session.id, provider: "stripe" } });
      if (donation) await transitionDonation(donation.id, "FAILED", { failureReason: "Paiement asynchrone refusé" });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi && charge.refunded) {
        const donation = await prisma.donation.findFirst({ where: { providerPaymentId: pi, provider: "stripe" } });
        if (donation) await transitionDonation(donation.id, "REFUNDED", { notes: `Remboursé via Stripe (${charge.id})` });
      }
      break;
    }
  }
  return Response.json({ received: true });
}
