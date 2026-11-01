import { describe, expect, it } from "vitest";
import { canTransition, sourcesFor } from "@/lib/donation-status";
import { interpretMonCashPayment } from "@/lib/payments/moncash";
import { interpretCheckoutSession } from "@/lib/payments/stripe";
import { generateReference } from "@/lib/donations";
import type Stripe from "stripe";

describe("machine à états des dons", () => {
  it("autorise uniquement les transitions prévues", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "REFUNDED")).toBe(true);
    expect(canTransition("PENDING", "REFUNDED")).toBe(false);
    expect(canTransition("REFUNDED", "CONFIRMED")).toBe(false);
    expect(canTransition("CONFIRMED", "PENDING")).toBe(false);
    expect(canTransition("CONFIRMED", "FAILED")).toBe(false);
  });
  it("calcule les statuts sources d'une transition", () => {
    expect(sourcesFor("REFUNDED")).toEqual(["CONFIRMED"]);
    expect(sourcesFor("CONFIRMED").sort()).toEqual(["CANCELLED", "FAILED", "PENDING"]);
  });
  it("génère des références uniques et lisibles", () => {
    const refs = new Set(Array.from({ length: 2000 }, () => generateReference()));
    expect(refs.size).toBe(2000);
    for (const r of refs) expect(r).toMatch(/^DON-\d{4}-[A-HJ-NP-Z2-9]{8}$/);
  });
});

describe("vérification MonCash", () => {
  const d = { reference: "DON-2026-ABCDEFGH", amountCents: 250000 };
  it("confirme un paiement réussi au bon montant et à la bonne référence", () => {
    const r = interpretMonCashPayment(d, { payment: { reference: d.reference, transaction_id: "123456", cost: 2500, message: "successful" } });
    expect(r).toEqual({ status: "CONFIRMED", providerPaymentId: "123456", amountCents: 250000, currency: "HTG" });
  });
  it("refuse un montant différent", () => {
    const r = interpretMonCashPayment(d, { payment: { reference: d.reference, transaction_id: "1", cost: 25, message: "successful" } });
    expect(r.status).toBe("FAILED");
  });
  it("refuse une référence différente", () => {
    const r = interpretMonCashPayment(d, { payment: { reference: "AUTRE", transaction_id: "1", cost: 2500, message: "successful" } });
    expect(r.status).toBe("FAILED");
  });
  it("reste en attente sans transaction", () => {
    expect(interpretMonCashPayment(d, {}).status).toBe("PENDING");
  });
});

describe("Stripe Checkout", () => {
  const base = { id: "cs_test", amount_total: 50000, currency: "htg", payment_intent: "pi_1", status: "complete" };
  it("confirme uniquement une session payée", () => {
    expect(interpretCheckoutSession({ ...base, payment_status: "paid" } as Stripe.Checkout.Session)).toMatchObject({ status: "CONFIRMED", amountCents: 50000, currency: "HTG", providerPaymentId: "pi_1" });
    expect(interpretCheckoutSession({ ...base, payment_status: "unpaid" } as Stripe.Checkout.Session).status).toBe("PENDING");
    expect(interpretCheckoutSession({ ...base, status: "expired", payment_status: "unpaid" } as Stripe.Checkout.Session).status).toBe("CANCELLED");
  });
});
