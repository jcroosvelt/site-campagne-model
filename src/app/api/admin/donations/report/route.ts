import { prisma } from "@/lib/db";
import { assertPermission, ForbiddenError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/utils";
import { METHOD_LABELS_FR } from "@/lib/donation-status";

export const runtime = "nodejs";

/** Rapport agrégé mensuel (dons CONFIRMÉS uniquement, nets des remboursements exclus). */
export async function GET() {
  let user;
  try {
    user = await assertPermission("donations.stats");
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Accès refusé", { status: 403 });
    throw e;
  }
  const rows = await prisma.$queryRaw<{ month: string; method: keyof typeof METHOD_LABELS_FR; count: bigint; total: bigint }[]>`
    SELECT to_char(date_trunc('month', "confirmedAt" AT TIME ZONE 'America/Port-au-Prince'), 'YYYY-MM') AS month,
           "method"::text AS method, COUNT(*) AS count, SUM("amountCents") AS total
    FROM "Donation" WHERE "status" = 'CONFIRMED'
    GROUP BY 1, 2 ORDER BY 1 DESC, 2`;
  await audit(user.id, "donation.report.download", "Donation");
  const csv = toCsv([
    ["Mois", "Moyen de paiement", "Nombre de contributions confirmées", "Montant total (HTG)"],
    ...rows.map((r) => [r.month, METHOD_LABELS_FR[r.method] ?? r.method, Number(r.count), (Number(r.total) / 100).toFixed(2)]),
  ]);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rapport-contributions-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
