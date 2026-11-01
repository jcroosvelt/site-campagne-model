import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { categoryFields } from "@/lib/admin-forms";
import { localize } from "@/lib/i18n-shared-server";
import { AdminHeader, Card } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveCategoryAction } from "../../../actions";

export const metadata = { title: "Catégories" };

export default async function Categories() {
  await requireUser("news.manage");
  const cats = await prisma.articleCategory.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { articles: true } } } });
  return (
    <>
      <AdminHeader title="Catégories d'actualités" back={{ href: "/admin/actualites", label: "Actualités" }} />
      <div className="space-y-6">
        {cats.map((c) => (
          <Card key={c.id} title={`${localize(c.name, "fr")} · ${c._count.articles} article(s)`}>
            <JsonForm fields={categoryFields} initial={c as unknown as Record<string, unknown>} action={saveCategoryAction} hidden={{ id: c.id }} />
            <div className="mt-2"><DeleteButton kind="category" id={c.id} confirmText="Supprimer la catégorie ? Les articles seront conservés sans catégorie." /></div>
          </Card>
        ))}
        <Card title="Nouvelle catégorie">
          <JsonForm fields={categoryFields} initial={{}} action={saveCategoryAction} hidden={{ id: "" }} submitLabel="Créer" />
        </Card>
      </div>
    </>
  );
}
