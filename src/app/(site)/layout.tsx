import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Beacon } from "@/components/site/Beacon";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDictionary();
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900">
        {t.nav.skip}
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <Beacon />
    </>
  );
}
