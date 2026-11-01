import { prisma } from "@/lib/db";
import { assertPermission, ForbiddenError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { donationWhere, filtersFromSearch } from "@/lib/donation-filters";
import { METHOD_LABELS_FR, STATUS_LABELS_FR } from "@/lib/donation-status";
import { toCsv } from "@/lib/utils";

export const runtime = "nodejs";

/** Export CSV des contributions (données autorisées uniquement, jamais de données de carte). */
export async function GET(req: Request) {
  let user;
  try {
    user = await assertPermission("donations.export");
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Accès refusé", { status: 403 });
    throw e;
  }
  const filters = filtersFromSearch(new URL(req.url).searchParams);
  const rows = await prisma.donation.findMany({ where: donationWhere(filters), orderBy: { createdAt: "desc" }, take: 50000 });
  await audit(user.id, "donation.export.csv", "Donation", undefined, { filters, count: rows.length });
  const csv = toCsv([
    ["Référence", "Date", "Statut", "Montant (HTG)", "Moyen", "Prénom", "Nom", "E-mail", "Téléphone", "Pays", "N° reçu", "Confirmé le", "Réf. prestataire", "Version CGU"],
    ...rows.map((d) => [
      d.reference,
      d.createdAt.toISOString(),
      STATUS_LABELS_FR[d.status],
      (d.amountCents / 100).toFixed(2),
      METHOD_LABELS_FR[d.method],
      d.firstName,
      d.lastName,
      d.email,
      d.phone ?? "",
      d.country,
      d.receiptNumber ?? "",
      d.confirmedAt?.toISOString() ?? "",
      d.providerPaymentId ?? d.providerRef ?? "",
      d.termsVersion,
    ]),
  ]);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contributions-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
