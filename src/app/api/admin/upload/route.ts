import { prisma } from "@/lib/db";
import { assertPermission, ForbiddenError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/request";
import { MAX_UPLOAD_BYTES, sniffType, storeFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return Response.json({ error: "Origine refusée" }, { status: 403 });
  let user;
  try {
    user = await assertPermission("media.upload");
  } catch (e) {
    if (e instanceof ForbiddenError) return Response.json({ error: "Accès refusé" }, { status: 403 });
    throw e;
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Fichier manquant" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Fichier trop volumineux (15 Mo max.)" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffType(buf);
  if (!mime) return Response.json({ error: "Format non autorisé (JPEG, PNG, WebP, AVIF ou PDF)" }, { status: 415 });
  const url = await storeFile(buf, mime);
  const alt = String(form.get("alt") ?? "").slice(0, 300) || null;
  const upload = await prisma.upload.create({ data: { url, filename: file.name.slice(0, 200), mimeType: mime, size: file.size, alt } });
  await audit(user.id, "media.upload", "Upload", upload.id, { filename: upload.filename, size: upload.size });
  return Response.json({ url, id: upload.id });
}
