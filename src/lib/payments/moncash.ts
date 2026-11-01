import "server-only";
import type { Donation } from "@prisma/client";
import { env } from "../env";
import type { CreatePaymentResult, PaymentProvider, VerificationResult } from "./types";

/**
 * MonCash (Digicel Haïti) — API « MonCash Button » pour marchands.
 * Flux : jeton OAuth → CreatePayment(orderId = référence du don) → redirection du donateur →
 * retour sur /api/payments/moncash/return?transactionId=… → vérification serveur via
 * RetrieveTransactionPayment / RetrieveOrderPayment. Le statut n'est JAMAIS déduit de la redirection seule.
 * L'URL de retour doit être déclarée dans le portail marchand MonCash.
 */
function hosts() {
  const live = env.moncash().mode === "live";
  const base = live ? "https://moncashbutton.digicelgroup.com" : "https://sandbox.moncashbutton.digicelgroup.com";
  return { api: `${base}/Api`, gateway: `${base}/Moncash-middleware` };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function moncashToken(fetchImpl: typeof fetch = fetch): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) return cachedToken.token;
  const { clientId, clientSecret } = env.moncash();
  if (!clientId || !clientSecret) throw new Error("Identifiants MonCash manquants");
  const res = await fetchImpl(`${hosts().api}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "scope=read,write&grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`MonCash OAuth: HTTP ${res.status}`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("MonCash OAuth: jeton absent");
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 59) * 1000 };
  return data.access_token;
}

async function call<T>(path: string, body: unknown, fetchImpl: typeof fetch = fetch): Promise<{ httpStatus: number; data: T }> {
  const token = await moncashToken(fetchImpl);
  const res = await fetchImpl(`${hosts().api}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { httpStatus: res.status, data };
}

type MonCashPayment = {
  payment?: { reference?: string; transaction_id?: string; cost?: number | string; message?: string; payer?: string };
  status?: number;
};

/** Interprète la réponse de vérification MonCash en la confrontant au don attendu. */
export function interpretMonCashPayment(d: Pick<Donation, "reference" | "amountCents">, r: MonCashPayment): VerificationResult {
  const p = r.payment;
  if (!p || !p.transaction_id) return { status: "PENDING" };
  if (p.reference !== d.reference) return { status: "FAILED", reason: "Référence de commande incohérente" };
  const paidCents = Math.round(Number(p.cost) * 100);
  if (String(p.message).toLowerCase() !== "successful") return { status: "FAILED", reason: `MonCash: ${p.message ?? "échec"}` };
  if (paidCents !== d.amountCents) return { status: "FAILED", reason: `Montant incohérent (${paidCents} ≠ ${d.amountCents})` };
  return { status: "CONFIRMED", providerPaymentId: String(p.transaction_id), amountCents: paidCents, currency: "HTG" };
}

export async function retrieveByTransactionId(transactionId: string, fetchImpl: typeof fetch = fetch) {
  const { data } = await call<MonCashPayment>("/v1/RetrieveTransactionPayment", { transactionId }, fetchImpl);
  return data;
}

export const moncashProvider: PaymentProvider = {
  id: "moncash",
  method: "MONCASH",
  isConfigured() {
    const c = env.moncash();
    return Boolean(c.clientId && c.clientSecret);
  },
  async createPayment(d: Donation): Promise<CreatePaymentResult> {
    const { httpStatus, data } = await call<{ payment_token?: { token?: string } }>("/v1/CreatePayment", {
      amount: d.amountCents / 100,
      orderId: d.reference,
    });
    const token = data.payment_token?.token;
    if (httpStatus >= 300 || !token) throw new Error(`MonCash CreatePayment: HTTP ${httpStatus}`);
    return { kind: "redirect", url: `${hosts().gateway}/Payment/Redirect?token=${encodeURIComponent(token)}`, providerRef: d.reference };
  },
  async verify(d: Donation): Promise<VerificationResult> {
    const { httpStatus, data } = await call<MonCashPayment>("/v1/RetrieveOrderPayment", { orderId: d.reference });
    if (httpStatus === 404) return { status: "PENDING" };
    return interpretMonCashPayment(d, data);
  },
};
