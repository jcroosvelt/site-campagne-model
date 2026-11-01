import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { publishedThemes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { ThemeIcon } from "@/components/ui/icons";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.vision };
}

export default async function VisionPage() {
  const { t, l } = await getDictionary();
  const [home, themes] = await Promise.all([getSetting("home"), publishedThemes()]);
  return (
    <>
      <PageHeader kicker={t.nav.vision} title={l(home.visionTitle)} intro={l(home.visionBody)} />
      <section className="py-20 md:py-28">
        <div className="container-site space-y-0">
          {home.visionPillars.map((p, i) => (
            <article key={i} className="grid gap-6 border-t border-line py-14 md:grid-cols-12">
              <p className="font-serif text-6xl leading-none font-semibold text-gold-500/60 md:col-span-2">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="text-3xl font-semibold md:col-span-4">{l(p.title)}</h2>
              <p className="text-lg leading-relaxed text-muted md:col-span-6">{l(p.text)}</p>
            </article>
          ))}
        </div>
      </section>
      {themes.length > 0 && (
        <section className="bg-ivory py-20">
          <div className="container-site">
            <h2 className="h2">{t.program.title}</h2>
            <ul className="mt-10 flex flex-wrap gap-3">
              {themes.map((th) => (
                <li key={th.id}>
                  <Link href={`/programme/${th.slug}`} className="inline-flex items-center gap-2 border border-navy-900/15 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:border-navy-900">
                    <ThemeIcon name={th.icon} className="h-4 w-4 text-crimson-600" /> {l(th.title)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/programme" className="btn btn-primary mt-10">{t.hero.discover} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </section>
      )}
    </>
  );
}
