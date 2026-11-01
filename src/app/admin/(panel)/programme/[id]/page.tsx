import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { themeFields } from "@/lib/admin-forms";
import { AdminHeader } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveThemeAction } from "../../../actions";

export default async function ThemeEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("content.manage");
  const { id } = await params;
  const t = id === "nouveau" ? null : await prisma.programTheme.findUnique({ where: { id } });
  if (id !== "nouveau" && !t) notFound();
  return (
    <>
      <AdminHeader title={t ? "Modifier la thématique" : "Nouvelle thématique"} back={{ href: "/admin/programme", label: "Programme" }} actions={t && <DeleteButton kind="theme" id={t.id} />} />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={themeFields} action={saveThemeAction} hidden={{ id: t?.id ?? "" }} initial={t ? { ...t, image: t.image ?? "" } as Record<string, unknown> : { published: true, icon: "landmark" }} />
      </div>
    </>
  );
}
