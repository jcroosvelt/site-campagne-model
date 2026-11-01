import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { articleFields } from "@/lib/admin-forms";
import { localize } from "@/lib/i18n-shared-server";
import { dateToHaitiLocal } from "@/lib/time";
import { AdminHeader } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveArticleAction } from "../../../actions";

export default async function ArticleEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("news.manage");
  const { id } = await params;
  const [a, cats] = await Promise.all([
    id === "nouveau" ? null : prisma.article.findUnique({ where: { id } }),
    prisma.articleCategory.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (id !== "nouveau" && !a) notFound();
  const initial = a
    ? { ...a, categoryId: a.categoryId ?? "", coverImage: a.coverImage ?? "", coverAlt: a.coverAlt ?? "", videoUrl: a.videoUrl ?? "", seoTitle: a.seoTitle ?? "", seoDescription: a.seoDescription ?? "", publishedAt: dateToHaitiLocal(a.publishedAt) }
    : { status: "DRAFT" };
  return (
    <>
      <AdminHeader
        title={a ? "Modifier l'article" : "Nouvel article"}
        back={{ href: "/admin/actualites", label: "Actualités" }}
        actions={a && <>{a.status === "PUBLISHED" && <Link href={`/actualites/${a.slug}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">Voir</Link>}<DeleteButton kind="article" id={a.id} /></>}
      />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={articleFields(cats.map((c) => ({ id: c.id, name: localize(c.name, "fr") })))} initial={initial as Record<string, unknown>} action={saveArticleAction} hidden={{ id: a?.id ?? "" }} />
      </div>
    </>
  );
}
