import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Card } from "@/components/admin/ui";
import { UploadBox } from "@/components/admin/UploadBox";

export const metadata = { title: "Médiathèque" };

export default async function MediaLibrary() {
  await requireUser("media.upload");
  const uploads = await prisma.upload.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <AdminHeader title="Médiathèque" description="Fichiers téléversés (JPEG, PNG, WebP, AVIF, PDF — 15 Mo max.). Le type réel de chaque fichier est vérifié." />
      <Card className="mb-8"><UploadBox /></Card>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {uploads.map((u) => (
          <li key={u.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {u.mimeType.startsWith("image/") ? <img src={u.url} alt={u.alt ?? ""} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">PDF</div>}
            <div className="p-3 text-xs">
              <p className="truncate font-medium" title={u.filename}>{u.filename}</p>
              <p className="text-slate-500">{Math.round(u.size / 1024)} Ko · {formatDate(u.createdAt, "fr", { dateStyle: "short" })}</p>
              <input readOnly value={u.url} className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[0.7rem]" aria-label="URL du fichier" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
