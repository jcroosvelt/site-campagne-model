import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Vérifie la signature binaire réelle du fichier (ne pas se fier au type MIME déclaré). */
export function sniffType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavi")) return "image/avif";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

/** Enregistre un fichier et retourne son URL publique. */
export async function storeFile(buf: Buffer, mime: string): Promise<string> {
  const ext = ALLOWED_UPLOAD_TYPES[mime];
  if (!ext) throw new Error("Type de fichier non autorisé");
  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(12).toString("hex")}.${ext}`;
  const cfg = env.storage();

  if (cfg.driver === "supabase") {
    if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error("Stockage Supabase non configuré");
    const res = await fetch(`${cfg.supabaseUrl}/storage/v1/object/${cfg.bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.supabaseKey}`, "Content-Type": mime, "x-upsert": "false" },
      body: new Uint8Array(buf),
    });
    if (!res.ok) throw new Error(`Échec de l'envoi vers Supabase Storage (${res.status})`);
    return `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/${key}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(key));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", key), buf);
  return `/uploads/${key}`;
}
