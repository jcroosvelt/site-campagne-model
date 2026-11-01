import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";

/** Champs anti-robots : un « pot de miel » invisible et un horodatage signé du rendu du formulaire. */
export const HONEYPOT_FIELD = "website_url";
export const TS_FIELD = "_ts";

export function signTimestamp(ts = Date.now()): string {
  const sig = createHmac("sha256", env.appSecret()).update(String(ts)).digest("hex").slice(0, 16);
  return `${ts}.${sig}`;
}

/** Retourne true si la soumission ressemble à un robot. */
export function looksLikeSpam(fd: FormData, minDelayMs = 2500): boolean {
  if (String(fd.get(HONEYPOT_FIELD) ?? "").trim() !== "") return true;
  const raw = String(fd.get(TS_FIELD) ?? "");
  const [ts, sig] = raw.split(".");
  if (!ts || !sig || signTimestamp(Number(ts)) !== raw) return true;
  const age = Date.now() - Number(ts);
  return age < minDelayMs || age > 24 * 60 * 60 * 1000;
}
