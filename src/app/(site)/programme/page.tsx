import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileDown } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { publishedThemes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { ThemeIcon } from "@/components/ui/icons";
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
        <a href={pdfUrl} className="btn btn-outline-light" download>
          <FileDown className="h-4 w-4" aria-hidden /> {t.program.downloadPdf}
        </a>
      </PageHeader>
      <section className="py-20 md:py-28">
        <div className="container-site">
          {themes.length === 0 && <p className="text-muted">{t.common.noContent}</p>}
          <ul className="divide-y divide-line">
            {themes.map((th) => (
              <li key={th.id}>
                <Link href={`/programme/${th.slug}`} className="group grid items-center gap-6 rounded-2xl py-7 transition-colors hover:bg-navy-50 md:grid-cols-[4rem_1fr_1.4fr_2rem] md:px-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-flag-100 text-flag transition-colors group-hover:bg-flag group-hover:text-white"><ThemeIcon name={th.icon} className="h-7 w-7" /></span>
                  <h2 className="text-4xl font-black condensed sm:text-5xl">{l(th.title)}</h2>
                  <p className="leading-relaxed text-muted">{l(th.summary)}</p>
                  <ArrowUpRight className="hidden h-5 w-5 text-navy-900 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 md:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
