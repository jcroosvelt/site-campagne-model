import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/i18n-shared-server";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, ButtonLink, Table, td } from "@/components/admin/ui";

export const metadata = { title: "Rapports financiers" };

export default async function Reports() {
  await requireUser("reports.manage");
  const reports = await prisma.financialReport.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminHeader title="Rapports financiers" description="Rapports autorisés publiés sur la page Transparence. Ne publiez que des documents validés." actions={<ButtonLink href="/admin/rapports/nouveau">Nouveau rapport</ButtonLink>} />
      <Table head={["Titre", "Période", "Statut", "Publication"]} empty={reports.length === 0}>
        {reports.map((r) => (
          <tr key={r.id}>
            <td className={td}><Link href={`/admin/rapports/${r.id}`} className="font-medium text-navy-900 hover:underline">{localize(r.title, "fr")}</Link></td>
            <td className={td}>{r.period}</td>
            <td className={td}><Badge tone={r.published ? "PUBLISHED" : "DRAFT"}>{r.published ? "Publié" : "Non publié"}</Badge></td>
            <td className={td}>{r.publishedAt ? formatDate(r.publishedAt, "fr") : "—"}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
