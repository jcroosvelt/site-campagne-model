import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n";
import { getNavigation } from "@/lib/navigation";
import { getSetting } from "@/lib/settings";
import { HeaderShell } from "./HeaderShell";

export async function Header() {
  const { t, l, locale } = await getDictionary();
  const [links, site] = await Promise.all([getNavigation(locale, t), getSetting("site")]);
  return (
    <Suspense>
      <HeaderShell
        links={links}
        locale={locale}
        brand={{ name: site.campaignName, tagline: l(site.electionLabel).replace("[À COMPLÉTER] ", ""), logoUrl: site.logoUrl || undefined }}
        labels={{ donate: t.nav.donate, menu: t.nav.menu, close: t.nav.close, language: t.nav.language }}
      />
    </Suspense>
  );
}
