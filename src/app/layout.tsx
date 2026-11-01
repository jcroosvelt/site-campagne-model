import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { getLocale, getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const { l } = await getDictionary();
  const [seo, site] = await Promise.all([getSetting("seo"), getSetting("site")]);
  const title = l(seo.title);
  return {
    metadataBase: new URL(env.appUrl()),
    title: { default: title, template: `%s — ${site.campaignName}` },
    description: l(seo.description),
    keywords: seo.keywords,
    robots: seo.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", siteName: site.campaignName, title, description: l(seo.description), images: seo.ogImage ? [seo.ogImage] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#00209f", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "ht" ? "ht" : locale}>
      <body>{children}</body>
    </html>
  );
}
