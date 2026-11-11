import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getArticle, relatedArticles } from "@/lib/queries";
import { env } from "@/lib/env";
import { formatDate, toVideoEmbed } from "@/lib/utils";
import { Markdown } from "@/components/ui/Markdown";
import { Photo } from "@/components/ui/Photo";
import { ArticleCard } from "@/components/site/cards";
import { ShareButtons } from "@/components/site/ShareButtons";

type Props = { params: Promise<{ slug: string }> };

const load = getArticle;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { l } = await getDictionary();
  const a = await load((await params).slug);
  if (!a) return {};
  const title = a.seoTitle || l(a.title);
  const description = a.seoDescription || l(a.excerpt);
  return {
    title,
    description,
    openGraph: { type: "article", title, description, publishedTime: a.publishedAt?.toISOString(), images: a.coverImage ? [a.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { t, l, locale } = await getDictionary();
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();
  const related = await relatedArticles(a.id, a.categoryId);
  const embed = toVideoEmbed(a.videoUrl);
  const title = l(a.title);
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: title, datePublished: a.publishedAt?.toISOString(), dateModified: a.updatedAt.toISOString(), image: a.coverImage ? [a.coverImage] : undefined };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="bg-flag text-white">
        <div className="container-site max-w-4xl pt-32 pb-16 md:pt-40">
          <Link href="/actualites" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"> {t.news.title}</Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-bold">
            {a.category && <Link href={`/actualites?categorie=${a.category.slug}`} className="text-gold-300">{l(a.category.name)}</Link>}
            {a.publishedAt && <time dateTime={a.publishedAt.toISOString()} className="text-white/60">{t.news.publishedOn} {formatDate(a.publishedAt, locale)}</time>}
          </div>
          <h1 className="mt-5 text-5xl leading-[0.95] font-black text-white condensed md:text-7xl">{title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-white/70">{l(a.excerpt)}</p>
        </div>
      </header>
      <div className="container-site max-w-4xl py-14">
        {a.coverImage && <Photo src={a.coverImage} alt={a.coverAlt || title} priority className="-mt-24 mb-12 aspect-[16/9] shadow-xl md:-mt-28" sizes="(min-width:1024px) 900px, 100vw" />}
        <Markdown>{l(a.body)}</Markdown>
        {embed && (
          <div className="mt-12">
            <p className="mb-3 text-sm font-bold text-muted">{t.news.video}</p>
            <div className="relative aspect-video overflow-hidden bg-navy-950">
              <iframe src={embed} title={title} className="absolute inset-0 h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </div>
        )}
        <div className="mt-14 border-t border-line pt-8">
          <ShareButtons url={`${env.appUrl()}/actualites/${a.slug}`} title={title} labels={t.common} />
        </div>
      </div>
      {related.length > 0 && (
        <section className="bg-ivory py-20">
          <div className="container-site">
            <h2 className="h2 mb-12">{t.news.related}</h2>
            <div className="grid gap-10 md:grid-cols-3">{related.map((r) => <ArticleCard key={r.id} a={r} locale={locale} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
