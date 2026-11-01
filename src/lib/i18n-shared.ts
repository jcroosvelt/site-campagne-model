export const LOCALES = ["fr", "ht", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export type L10n = Record<Locale, string>;

export const LOCALE_NAMES: Record<Locale, string> = { fr: "Français", ht: "Kreyòl ayisyen", en: "English" };
export const LOCALE_SHORT: Record<Locale, string> = { fr: "FR", ht: "HT", en: "EN" };

export function l10n(fr: string, ht = "", en = ""): L10n {
  return { fr, ht, en };
}
