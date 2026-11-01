import "server-only";
import type { PaymentProvider } from "./types";

/**
 * Virement bancaire : aucun prestataire en ligne. Le don reste « En attente » jusqu'au
 * rapprochement bancaire effectué par un responsable financier dans l'administration
 * (saisie de la référence bancaire, opération journalisée).
 */
export const bankProvider: PaymentProvider = {
  id: "bank",
  method: "BANK_TRANSFER",
  isConfigured() {
    return true;
  },
  async createPayment() {
    return { kind: "instructions" };
  },
};
