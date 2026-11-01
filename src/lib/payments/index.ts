import "server-only";
import type { PaymentMethod } from "@prisma/client";
import type { SectionValue } from "../settings-schema";
import { COMPLIANCE_GLOBAL_KEYS } from "../settings-schema";
import { stripeProvider } from "./stripe";
import { moncashProvider } from "./moncash";
import { bankProvider } from "./bank";
import type { PaymentProvider } from "./types";

export const PROVIDERS: Record<PaymentMethod, PaymentProvider> = {
  CARD: stripeProvider,
  MONCASH: moncashProvider,
  BANK_TRANSFER: bankProvider,
};

export const METHODS: PaymentMethod[] = ["CARD", "MONCASH", "BANK_TRANSFER"];

export type MethodStatus = { method: PaymentMethod; available: boolean; blockers: string[] };

/**
 * Un moyen de paiement n'est proposé que si TOUTES les conditions sont réunies :
 * conformité globale validée, dons ouverts, moyen activé, conformité du moyen validée,
 * identifiants du prestataire présents (et coordonnées bancaires pour le virement).
 */
export function methodStatuses(cfg: SectionValue<"donations">, compliance: SectionValue<"compliance">): MethodStatus[] {
  const globalBlockers: string[] = [];
  const missing = COMPLIANCE_GLOBAL_KEYS.filter((k) => !compliance[k]);
  if (missing.length) globalBlockers.push(`Conformité non validée (${missing.length} point(s) restant(s))`);
  if (!cfg.enabled) globalBlockers.push("Dons en ligne désactivés");

  const perMethod: Record<PaymentMethod, { enabled: boolean; validated: boolean; extra?: string | null }> = {
    CARD: { enabled: cfg.cardEnabled, validated: compliance.cardValidated },
    MONCASH: { enabled: cfg.moncashEnabled, validated: compliance.moncashValidated },
    BANK_TRANSFER: {
      enabled: cfg.bankEnabled,
      validated: compliance.bankValidated,
      extra: cfg.bankAccountNumber && cfg.bankName ? null : "Coordonnées bancaires incomplètes",
    },
  };

  return METHODS.map((method) => {
    const m = perMethod[method];
    const blockers = [...globalBlockers];
    if (!m.enabled) blockers.push("Moyen de paiement désactivé");
    if (!m.validated) blockers.push("Conformité du moyen de paiement non validée");
    if (!PROVIDERS[method].isConfigured()) blockers.push("Identifiants du prestataire absents de l'environnement");
    if (m.extra) blockers.push(m.extra);
    return { method, available: blockers.length === 0, blockers };
  });
}
