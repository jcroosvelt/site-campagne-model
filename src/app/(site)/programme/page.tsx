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
          <ol className="divide-y divide-line border-y border-line">
            {themes.map((th, i) => (
              <li key={th.id}>
                <Link href={`/programme/${th.slug}`} className="group grid items-center gap-6 py-8 transition-colors hover:bg-ivory md:grid-cols-[4rem_3rem_1fr_1.4fr_2rem] md:px-4">
                  <span className="font-serif text-sm font-semibold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                  <ThemeIcon name={th.icon} className="h-8 w-8 text-crimson-600" />
                  <h2 className="text-2xl font-semibold">{l(th.title)}</h2>
                  <p className="leading-relaxed text-muted">{l(th.summary)}</p>
                  <ArrowUpRight className="hidden h-5 w-5 text-navy-900 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 md:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
