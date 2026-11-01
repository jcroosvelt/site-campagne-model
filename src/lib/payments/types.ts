import type { Donation, PaymentMethod } from "@prisma/client";

export type CreatePaymentResult =
  | { kind: "redirect"; url: string; providerRef: string }
  | { kind: "instructions"; providerRef?: string };

/** Résultat d'une vérification faite côté serveur auprès du prestataire. */
export type VerificationResult =
  | { status: "CONFIRMED"; providerPaymentId: string; amountCents: number; currency: string }
  | { status: "FAILED" | "CANCELLED"; reason: string }
  | { status: "PENDING" };

export interface PaymentProvider {
  readonly id: string;
  readonly method: PaymentMethod;
  /** Les identifiants nécessaires sont-ils présents dans l'environnement ? */
  isConfigured(): boolean;
  createPayment(donation: Donation, urls: { returnUrl: string; cancelUrl: string }): Promise<CreatePaymentResult>;
  /** Interroge le prestataire pour connaître l'état réel du paiement (jamais de confiance au navigateur). */
  verify?(donation: Donation): Promise<VerificationResult>;
}
