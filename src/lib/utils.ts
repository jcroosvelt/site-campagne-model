import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const LOCALE_TAG: Record<string, string> = { fr: "fr-HT", ht: "fr-HT", en: "en-US" };

/** Formate un montant exprimé en centimes. */
export function formatMoney(amountCents: number, currency = "HTG", locale = "fr"): string {
  const value = amountCents / 100;
  const formatted = new Intl.NumberFormat(LOCALE_TAG[locale] ?? "fr-HT", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

export function formatDate(d: Date | string, locale = "fr", opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "fr-HT", {
    timeZone: "America/Port-au-Prince",
    ...(opts ?? { day: "numeric", month: "long", year: "numeric" }),
  }).format(date);
}

export function formatTime(d: Date, locale = "fr"): string {
  return formatDate(d, locale, { hour: "2-digit", minute: "2-digit" });
}

/** Rendu sûr d'une URL vidéo (YouTube / Vimeo) en URL d'intégration. Retourne null si non reconnue. */
export function toVideoEmbed(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumb(url?: string | null): string | null {
  const embed = toVideoEmbed(url);
  if (!embed || !embed.includes("youtube")) return null;
  const id = embed.split("/").pop();
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Neutralise les formules dans les exports CSV (injection CSV). */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function isSafeHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}
