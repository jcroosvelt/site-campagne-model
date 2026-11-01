import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/i18n-shared-server";
import { youtubeThumb } from "@/lib/utils";
import { AdminHeader, Badge, ButtonLink } from "@/components/admin/ui";

export const metadata = { title: "Galerie" };

export default async function GalleryAdmin() {
  await requireUser("gallery.manage");
  const items = await prisma.mediaItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <AdminHeader title="Galerie" description="Photos et vidéos affichées sur le site." actions={<ButtonLink href="/admin/galerie/nouveau">Ajouter</ButtonLink>} />
      {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">La galerie est vide.</p>}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((m) => {
          const src = m.imageUrl || youtubeThumb(m.videoUrl);
          return (
            <li key={m.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Link href={`/admin/galerie/${m.id}`} className="block">
                {src ? <img src={src} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-slate-100" />}
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-medium">{localize(m.title, "fr") || "(sans légende)"}</p>
                  <div className="flex gap-1.5"><Badge tone="DRAFT">{m.type === "VIDEO" ? "Vidéo" : "Photo"}</Badge>{!m.published && <Badge tone="ARCHIVED">Masqué</Badge>}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
