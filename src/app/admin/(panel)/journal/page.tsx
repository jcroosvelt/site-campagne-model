import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Table, td } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

export const metadata = { title: "Journal d'audit" };
const PER = 100;

export default async function Journal({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireUser("audit.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.action ? { action: { startsWith: sp.action.slice(0, 60) } } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
    prisma.auditLog.count({ where }),
  ]);
  return (
    <>
      <AdminHeader title="Journal d'audit" description="Opérations sensibles et administratives (connexions, modifications, exports, opérations financières)." />
      <form className="mb-4 flex gap-2"><input name="action" defaultValue={sp.action} placeholder="Filtrer par action (ex. donation., auth.)" className="input max-w-xs" /><button className="rounded-md bg-navy-900 px-4 text-sm font-semibold text-white">Filtrer</button></form>
      <Table head={["Date", "Utilisateur", "Action", "Objet", "IP", "Détails"]} empty={logs.length === 0}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className={`${td} whitespace-nowrap`}>{formatDate(l.createdAt, "fr", { dateStyle: "short", timeStyle: "medium" })}</td>
            <td className={td}>{l.user?.name ?? "—"}</td>
            <td className={`${td} font-mono text-xs`}>{l.action}</td>
            <td className={`${td} text-xs`}>{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 12)}` : ""}</td>
            <td className={`${td} font-mono text-xs`}>{l.ip}</td>
            <td className={`${td} max-w-xs truncate font-mono text-[0.7rem] text-slate-500`} title={l.details ? JSON.stringify(l.details) : ""}>{l.details ? JSON.stringify(l.details) : ""}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} href={(p) => `/admin/journal?page=${p}${sp.action ? `&action=${encodeURIComponent(sp.action)}` : ""}`} labels={{ previous: "Précédent", next: "Suivant", page: "Page" }} />
    </>
  );
}
