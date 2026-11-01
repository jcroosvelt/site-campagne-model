import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/i18n-shared-server";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, ButtonLink, Table, td } from "@/components/admin/ui";

export const metadata = { title: "Actualités" };

export default async function NewsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser("news.manage");
  const { q } = await searchParams;
  const articles = await prisma.article.findMany({
    where: q ? { slug: { contains: q.toLowerCase().slice(0, 80) } } : {},
    include: { category: true, author: { select: { name: true } } },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
  });
  const now = new Date();
  return (
    <>
      <AdminHeader
        title="Actualités"
        description="Les articles « publiés » avec une date future sont programmés et n'apparaissent qu'à cette date."
        actions={<><ButtonLink href="/admin/actualites/categories" variant="secondary">Catégories</ButtonLink><ButtonLink href="/admin/actualites/nouveau">Nouvel article</ButtonLink></>}
      />
      <Table head={["Titre", "Catégorie", "Statut", "Publication", "Auteur"]} empty={articles.length === 0}>
        {articles.map((a) => {
          const tone = a.status === "PUBLISHED" && a.publishedAt && a.publishedAt > now ? "SCHEDULED" : a.status;
          const label = { SCHEDULED: "Programmé", PUBLISHED: "Publié", DRAFT: "Brouillon", ARCHIVED: "Archivé" }[tone];
          return (
            <tr key={a.id}>
              <td className={td}><Link href={`/admin/actualites/${a.id}`} className="font-medium text-navy-900 hover:underline">{localize(a.title, "fr")}</Link></td>
              <td className={td}>{a.category ? localize(a.category.name, "fr") : "—"}</td>
              <td className={td}><Badge tone={tone}>{label}</Badge></td>
              <td className={td}>{a.publishedAt ? formatDate(a.publishedAt, "fr", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
              <td className={td}>{a.author?.name ?? "—"}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
