import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { LOCALES, DEFAULT_LOCALE, type Locale, type L10n } from "./i18n-shared";
import { localize } from "./i18n-shared-server";
import fr from "@/messages/fr";
import ht from "@/messages/ht";
import en from "@/messages/en";

export * from "./i18n-shared";

const DICTIONARIES = { fr, ht, en } as const;
export type Dictionary = typeof fr;

export const LOCALE_COOKIE = "locale";

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
});

export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary; l: (v: L10n | unknown) => string }> {
  const locale = await getLocale();
  return {
    locale,
    t: DICTIONARIES[locale] as Dictionary,
    l: (v) => localize(v, locale),
  };
}

export { localize, localizeList } from "./i18n-shared-server";
