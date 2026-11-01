import type { Metadata } from "next";
import Link from "next/link";
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
            <article key={i} className="grid gap-6 border-t-2 border-line py-14 md:grid-cols-12">
              <span className={`h-2 w-16 rounded-full md:col-span-2 md:mt-5 ${i % 2 ? "bg-crimson-600" : "bg-flag"}`} aria-hidden />
              <h2 className="text-4xl font-black condensed md:col-span-4 sm:text-5xl">{l(p.title)}</h2>
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
                  <Link href={`/programme/${th.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-navy-900 transition-colors hover:bg-flag hover:text-white">
                    <ThemeIcon name={th.icon} className="h-4 w-4 text-crimson-600" /> {l(th.title)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/programme" className="btn btn-primary mt-10">{t.hero.discover} </Link>
          </div>
        </section>
      )}
    </>
  );
}
