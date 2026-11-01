import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mediaFields } from "@/lib/admin-forms";
import { dateToHaitiLocal } from "@/lib/time";
import { AdminHeader } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveMediaAction } from "../../../actions";

export default async function MediaEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("gallery.manage");
  const { id } = await params;
  const m = id === "nouveau" ? null : await prisma.mediaItem.findUnique({ where: { id } });
  if (id !== "nouveau" && !m) notFound();
  const initial = m ? { ...m, imageUrl: m.imageUrl ?? "", videoUrl: m.videoUrl ?? "", takenAt: dateToHaitiLocal(m.takenAt) } : { published: true, type: "PHOTO", category: "MEETING" };
  return (
    <>
      <AdminHeader title={m ? "Modifier l'élément" : "Ajouter à la galerie"} back={{ href: "/admin/galerie", label: "Galerie" }} actions={m && <DeleteButton kind="media" id={m.id} />} />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={mediaFields} initial={initial as Record<string, unknown>} action={saveMediaAction} hidden={{ id: m?.id ?? "" }} />
      </div>
    </>
  );
}
