import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/i18n-shared-server";
import { AdminHeader, Badge, ButtonLink, Card, Table, td } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { setProgramPdfAction } from "../../actions";

export const metadata = { title: "Programme" };

export default async function ProgramAdmin() {
  await requireUser("content.manage");
  const [themes, pdf] = await Promise.all([prisma.programTheme.findMany({ orderBy: { order: "asc" } }), prisma.setting.findUnique({ where: { key: "programPdf" } })]);
  return (
    <>
      <AdminHeader title="Programme" description="Thématiques du programme électoral." actions={<ButtonLink href="/admin/programme/nouveau">Nouvelle thématique</ButtonLink>} />
      <Table head={["Ordre", "Thématique", "Statut", ""]} empty={themes.length === 0}>
        {themes.map((t) => (
          <tr key={t.id}>
            <td className={td}>{t.order}</td>
            <td className={td}><Link href={`/admin/programme/${t.id}`} className="font-medium text-navy-900 hover:underline">{localize(t.title, "fr")}</Link><p className="text-xs text-slate-500">/programme/{t.slug}</p></td>
            <td className={td}><Badge tone={t.published ? "PUBLISHED" : "DRAFT"}>{t.published ? "Publié" : "Masqué"}</Badge></td>
            <td className={`${td} text-right`}><Link href={`/admin/programme/${t.id}`} className="text-sm text-navy-700 underline">Modifier</Link></td>
          </tr>
        ))}
      </Table>
      <Card title="Programme complet en PDF" className="mt-8">
        <p className="mb-4 text-sm text-slate-600">Téléversez la version officielle mise en page. Sans fichier, un PDF est généré automatiquement à partir des thématiques publiées (<a className="underline" href={"/programme/pdf"} target="_blank" rel="noopener">aperçu</a>).</p>
        <JsonForm fields={[{ name: "url", label: "PDF officiel", type: "file" }]} initial={{ url: (pdf?.value as { url?: string } | null)?.url ?? "" }} action={setProgramPdfAction} />
      </Card>
    </>
  );
}
