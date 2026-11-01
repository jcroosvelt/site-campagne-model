// Fonctions de localisation pures (utilisables côté serveur et dans des composants partagés).
export * from "./i18n-shared";
import type { Locale } from "./i18n-shared";

export function localize(value: unknown, locale: Locale): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const v = value as Partial<Record<Locale, string>>;
  return v[locale] || v.fr || v.en || v.ht || "";
}

export function localizeList(value: unknown, locale: Locale): string[] {
  if (!value || typeof value !== "object") return [];
  const v = value as Partial<Record<Locale, string[]>>;
  const list = v[locale]?.length ? v[locale] : v.fr;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}
