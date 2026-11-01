import "server-only";
import type { DonationStatus, PaymentMethod, Prisma } from "@prisma/client";

export type DonationFilters = { q?: string; status?: string; method?: string; from?: string; to?: string; min?: string; max?: string };

const STATUSES: DonationStatus[] = ["PENDING", "CONFIRMED", "FAILED", "REFUNDED", "CANCELLED"];
const METHODS: PaymentMethod[] = ["CARD", "MONCASH", "BANK_TRANSFER"];

/** Construit un filtre Prisma sûr à partir des paramètres d'URL (requêtes paramétrées, pas d'injection SQL). */
export function donationWhere(f: DonationFilters): Prisma.DonationWhereInput {
  const where: Prisma.DonationWhereInput = {};
  const q = f.q?.trim().slice(0, 100);
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { providerRef: { contains: q } },
      { providerPaymentId: { contains: q } },
      { receiptNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  if (f.status && STATUSES.includes(f.status as DonationStatus)) where.status = f.status as DonationStatus;
  if (f.method && METHODS.includes(f.method as PaymentMethod)) where.method = f.method as PaymentMethod;
  const created: Prisma.DateTimeFilter = {};
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) created.gte = new Date(`${f.from}T00:00:00-05:00`);
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) created.lte = new Date(`${f.to}T23:59:59-05:00`);
  if (Object.keys(created).length) where.createdAt = created;
  const amount: Prisma.IntFilter = {};
  if (f.min && /^\d+$/.test(f.min)) amount.gte = Number(f.min) * 100;
  if (f.max && /^\d+$/.test(f.max)) amount.lte = Number(f.max) * 100;
  if (Object.keys(amount).length) where.amountCents = amount;
  return where;
}

export function filtersFromSearch(sp: URLSearchParams | Record<string, string | undefined>): DonationFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? (sp.get(k) ?? undefined) : sp[k]);
  return { q: get("q"), status: get("status"), method: get("method"), from: get("from"), to: get("to"), min: get("min"), max: get("max") };
}
