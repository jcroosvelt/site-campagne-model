import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileDown } from "lucide-react";
import { getDictionary, localizeList } from "@/lib/i18n";
import { getTheme, publishedThemes } from "@/lib/queries";
import { Markdown } from "@/components/ui/Markdown";
import { Photo } from "@/components/ui/Photo";
import { ThemeIcon } from "@/components/ui/icons";
import { getProgramPdfUrl } from "@/lib/program";

type Props = { params: Promise<{ slug: string }> };

const load = getTheme;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { l } = await getDictionary();
  const th = await load((await params).slug);
  return th ? { title: l(th.title), description: l(th.summary) } : {};
}

export default async function ThemePage({ params }: Props) {
  const { t, l, locale } = await getDictionary();
  const th = await load((await params).slug);
  if (!th) notFound();
  const [others, pdfUrl] = await Promise.all([publishedThemes(), getProgramPdfUrl()]);
  const measures = localizeList(th.measures, locale);
  return (
    <>
      <header className="bg-navy-900 text-white">
        <div className="container-site pt-32 pb-16 md:pt-40">
          <Link href="/programme" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden /> {t.program.allThemes}</Link>
          <div className="mt-10 flex items-start gap-6">
            <ThemeIcon name={th.icon} className="mt-2 hidden h-12 w-12 text-gold-300 sm:block" />
            <div>
              <h1 className="display text-white">{l(th.title)}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{l(th.summary)}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-crimson-600"><div className="h-full w-24 bg-gold-500" /></div>
      </header>
      <div className="container-site grid gap-16 py-20 lg:grid-cols-12">
        <article className="lg:col-span-8">
          {th.image && <Photo src={th.image} alt={l(th.title)} className="mb-12 aspect-[16/9]" sizes="(min-width:1024px) 60vw, 100vw" />}
          <Markdown>{l(th.body)}</Markdown>
          {measures.length > 0 && (
            <section className="mt-14 bg-ivory p-8 md:p-10">
              <h2 className="text-2xl font-semibold">{t.program.measures}</h2>
              <ul className="mt-6 space-y-4">
                {measures.map((m, i) => (
                  <li key={i} className="flex gap-4">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-crimson-600" aria-hidden />
                    <span className="leading-relaxed text-navy-900">{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-8">
            <a href={pdfUrl} download className="btn btn-primary w-full"><FileDown className="h-4 w-4" aria-hidden /> {t.program.downloadPdf}</a>
            <nav aria-label={t.program.otherThemes}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.program.otherThemes}</p>
              <ul className="divide-y divide-line border-y border-line">
                {others.filter((o) => o.id !== th.id).map((o) => (
                  <li key={o.id}>
                    <Link href={`/programme/${o.slug}`} className="flex items-center gap-3 py-3 text-sm font-medium text-navy-900 hover:text-crimson-600">
                      <ThemeIcon name={o.icon} className="h-4 w-4 text-gold-600" /> {l(o.title)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
}
