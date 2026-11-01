import "server-only";
import Stripe from "stripe";
import type { Donation } from "@prisma/client";
import { env } from "../env";
import type { CreatePaymentResult, PaymentProvider, VerificationResult } from "./types";

let client: Stripe | null = null;
export function stripeClient(): Stripe {
  const { secretKey } = env.stripe();
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY manquant");
  client ??= new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 20000 });
  return client;
}

/**
 * Cartes Visa / Mastercard via Stripe Checkout (page hébergée par Stripe, certifiée PCI-DSS).
 * Aucune donnée de carte ne transite ni n'est stockée sur nos serveurs.
 * Activer uniquement « Cartes » dans les moyens de paiement du tableau de bord Stripe.
 * Remarque : vérifier l'éligibilité du compte marchand (pays de l'entité, devise HTG) avant activation.
 */
export const stripeProvider: PaymentProvider = {
  id: "stripe",
  method: "CARD",
  isConfigured() {
    const c = env.stripe();
    return Boolean(c.secretKey && c.webhookSecret);
  },
  async createPayment(d: Donation, urls): Promise<CreatePaymentResult> {
    const session = await stripeClient().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: d.email,
        client_reference_id: d.reference,
        locale: d.locale === "en" ? "en" : "fr",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: d.currency.toLowerCase(),
              unit_amount: d.amountCents,
              product_data: { name: `Contribution volontaire — ${d.reference}` },
            },
          },
        ],
        metadata: { donationId: d.id, reference: d.reference },
        payment_intent_data: { metadata: { donationId: d.id, reference: d.reference } },
        success_url: urls.returnUrl,
        cancel_url: urls.cancelUrl,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 h
      },
      { idempotencyKey: `donation-${d.id}` },
    );
    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement");
    return { kind: "redirect", url: session.url, providerRef: session.id };
  },
  async verify(d: Donation): Promise<VerificationResult> {
    if (!d.providerRef) return { status: "PENDING" };
    const s = await stripeClient().checkout.sessions.retrieve(d.providerRef);
    return interpretCheckoutSession(s);
  },
};

export function interpretCheckoutSession(s: Stripe.Checkout.Session): VerificationResult {
  if (s.payment_status === "paid" || s.payment_status === "no_payment_required") {
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? s.id);
    return { status: "CONFIRMED", providerPaymentId: pi, amountCents: s.amount_total ?? 0, currency: (s.currency ?? "").toUpperCase() };
  }
  if (s.status === "expired") return { status: "CANCELLED", reason: "Session de paiement expirée" };
  return { status: "PENDING" };
}

/** Vérifie la signature d'un webhook Stripe (lève une erreur si invalide). */
export function constructStripeEvent(rawBody: string, signature: string | null): Stripe.Event {
  const { webhookSecret } = env.stripe();
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET manquant");
  if (!signature) throw new Error("Signature absente");
  return Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
