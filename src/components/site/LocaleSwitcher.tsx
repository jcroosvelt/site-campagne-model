"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { setLocaleAction } from "@/app/actions/public";
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT, type Locale } from "@/lib/i18n-shared";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale, label, light }: { locale: Locale; label: string; light?: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const path = pathname + (search.size ? `?${search.toString()}` : "");
  return (
    <form action={setLocaleAction} aria-label={label} className="flex items-center gap-0.5">
      <input type="hidden" name="path" value={path} />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          lang={l}
          title={LOCALE_NAMES[l]}
          aria-label={LOCALE_NAMES[l]}
          aria-pressed={l === locale}
          className={cn(
            "px-2 py-1 text-[0.72rem] font-semibold tracking-wider transition-colors",
            light ? "text-white/55 hover:text-white aria-pressed:text-white" : "text-navy-900/50 hover:text-navy-900 aria-pressed:text-navy-900",
            "aria-pressed:underline aria-pressed:decoration-gold-500 aria-pressed:decoration-2 aria-pressed:underline-offset-[6px]",
          )}
        >
          {LOCALE_SHORT[l]}
        </button>
      ))}
    </form>
  );
}
