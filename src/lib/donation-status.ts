import type { DonationStatus } from "@prisma/client";

/** Machine à états des dons : toute transition non listée est refusée. */
export const ALLOWED_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  PENDING: ["CONFIRMED", "FAILED", "CANCELLED"],
  // Une confirmation tardive vérifiée auprès du prestataire reste possible.
  FAILED: ["CONFIRMED"],
  CANCELLED: ["CONFIRMED"],
  CONFIRMED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransition(from: DonationStatus, to: DonationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function sourcesFor(to: DonationStatus): DonationStatus[] {
  return (Object.keys(ALLOWED_TRANSITIONS) as DonationStatus[]).filter((s) => canTransition(s, to));
}

export const STATUS_LABELS_FR: Record<DonationStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulé",
};

export const METHOD_LABELS_FR = { CARD: "Carte bancaire", MONCASH: "MonCash", BANK_TRANSFER: "Virement bancaire" } as const;
