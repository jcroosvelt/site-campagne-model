import Link from "next/link";
import { Download, FileSpreadsheet, Settings } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { confirmedDonationStats } from "@/lib/donations";
import { donationWhere, filtersFromSearch } from "@/lib/donation-filters";
import { METHOD_LABELS_FR, STATUS_LABELS_FR } from "@/lib/donation-status";
import { formatDate, formatMoney } from "@/lib/utils";
import { AdminHeader, Badge, Card, Stat, Table, td } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "Dons" };
const PER_PAGE = 50;

export default async function DonationsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("donations.stats");
  const sp = await searchParams;
  const filters = filtersFromSearch(sp);
  const where = donationWhere(filters);
  const page = Math.max(1, Number(sp.page) || 1);
  const canView = can(user.role, "donations.view");

  const [all, filtered, byStatus] = await Promise.all([
    confirmedDonationStats(),
    confirmedDonationStats(where),
    prisma.donation.groupBy({ by: ["status"], where, _count: true }),
  ]);
  const [rows, total] = canView
    ? await Promise.all([prisma.donation.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }), prisma.donation.count({ where })])
    : [[], 0];
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <AdminHeader
        title="Contributions"
        description="Les montants affichés comme « confirmés » proviennent exclusivement de paiements vérifiés par le prestataire ou par rapprochement bancaire."
        actions={
          <>
            <a href="/api/admin/donations/report" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium"><FileSpreadsheet className="h-4 w-4" /> Rapport mensuel</a>
            {can(user.role, "donations.export") && <a href={`/api/admin/donations/export?${qs}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium"><Download className="h-4 w-4" /> Export CSV</a>}
            {can(user.role, "donations.settings") && <Link href="/admin/dons/parametres" className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white"><Settings className="h-4 w-4" /> Paramètres</Link>}
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total confirmé (toutes périodes)" value={formatMoney(all.totalCents)} hint={`${all.count} contribution(s)`} />
        <Stat label="Confirmé — sélection" value={formatMoney(filtered.totalCents)} hint={`${filtered.count} contribution(s)`} />
        <Stat label="Don moyen confirmé" value={formatMoney(all.averageCents)} />
        <Stat label="Par statut — sélection" value={<span className="text-base font-sans">{byStatus.map((s) => `${STATUS_LABELS_FR[s.status]} : ${s._count}`).join(" · ") || "—"}</span>} />
      </div>

      <Card className="mt-8">
        <form className="grid gap-3 md:grid-cols-4 lg:grid-cols-8" role="search">
          <input name="q" defaultValue={filters.q} placeholder="Référence, nom, e-mail, reçu…" className="input md:col-span-2 lg:col-span-2" aria-label="Recherche" disabled={!canView} />
          <select name="status" defaultValue={filters.status ?? ""} className="input" aria-label="Statut">
            <option value="">Tous statuts</option>
            {Object.entries(STATUS_LABELS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="method" defaultValue={filters.method ?? ""} className="input" aria-label="Moyen de paiement">
            <option value="">Tous moyens</option>
            {Object.entries(METHOD_LABELS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" name="from" defaultValue={filters.from} className="input" aria-label="Du" />
          <input type="date" name="to" defaultValue={filters.to} className="input" aria-label="Au" />
          <input name="min" inputMode="numeric" defaultValue={filters.min} placeholder="Min HTG" className="input" aria-label="Montant minimum" />
          <input name="max" inputMode="numeric" defaultValue={filters.max} placeholder="Max HTG" className="input" aria-label="Montant maximum" />
          <div className="flex gap-2 lg:col-span-8">
            <button className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Filtrer</button>
            <Link href="/admin/dons" className="rounded-md border border-slate-300 px-4 py-2 text-sm">Réinitialiser</Link>
          </div>
        </form>
      </Card>

      {canView ? (
        <div className="mt-6">
          <Table head={["Date", "Référence", "Donateur", "Montant", "Moyen", "Statut", "Reçu"]} empty={rows.length === 0}>
            {rows.map((d) => (
              <tr key={d.id}>
                <td className={`${td} whitespace-nowrap`}>{formatDate(d.createdAt, "fr", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className={td}><Link href={`/admin/dons/${d.id}`} className="font-mono text-xs font-semibold text-navy-900 hover:underline">{d.reference}</Link></td>
                <td className={td}><p>{d.firstName} {d.lastName}</p><p className="text-xs text-slate-500">{d.email} · {d.country}</p></td>
                <td className={`${td} whitespace-nowrap font-semibold tabular-nums`}>{formatMoney(d.amountCents, d.currency)}</td>
                <td className={td}>{METHOD_LABELS_FR[d.method]}</td>
                <td className={td}><Badge tone={d.status}>{STATUS_LABELS_FR[d.status]}</Badge></td>
                <td className={`${td} font-mono text-xs`}>{d.receiptNumber ?? "—"}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER_PAGE))} href={(p) => `/admin/dons?${qs}&page=${p}`} labels={{ previous: "Précédent", next: "Suivant", page: "Page" }} />
        </div>
      ) : (
        <p className="mt-6 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Votre rôle donne accès aux statistiques agrégées uniquement. Les données personnelles des donateurs sont réservées aux responsables financiers et au super administrateur.</p>
      )}
    </>
  );
}
