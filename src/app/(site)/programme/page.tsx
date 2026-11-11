import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { publishedThemes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { getProgramPdfUrl } from "@/lib/program";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.program.title, description: t.program.intro };
}

export default async function ProgramPage() {
  const { t, l } = await getDictionary();
  const [themes, pdfUrl] = await Promise.all([publishedThemes(), getProgramPdfUrl()]);
  return (
    <>
      <PageHeader kicker={t.nav.program} title={t.program.title} intro={t.program.intro}>
        <a href={pdfUrl} className="btn btn-outline-light" download> {t.program.downloadPdf}
        </a>
      </PageHeader>
      <section className="py-20 md:py-28">
        <div className="container-site">
          {themes.length === 0 && <p className="text-muted">{t.common.noContent}</p>}
          <ul className="divide-y divide-line">
            {themes.map((th) => (
              <li key={th.id}>
                <Link href={`/programme/${th.slug}`} className="group grid items-center gap-6 rounded-2xl py-7 transition-colors hover:bg-navy-50 md:grid-cols-[1fr_1.4fr] md:px-5">
                  <h2 className="text-4xl font-black condensed sm:text-5xl">{l(th.title)}</h2>
                  <p className="leading-relaxed text-muted">{l(th.summary)}</p> </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
