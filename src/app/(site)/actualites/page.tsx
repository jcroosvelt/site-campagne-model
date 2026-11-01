import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { listArticles, listCategories } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { ArticleCard } from "@/components/site/cards";
import { Pagination } from "@/components/site/Pagination";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.news.title, description: t.news.intro };
}

type Props = { searchParams: Promise<{ categorie?: string; page?: string }> };

export default async function NewsPage({ searchParams }: Props) {
  const { t, l, locale } = await getDictionary();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [categories, { items, pages }] = await Promise.all([
    listCategories(),
    listArticles({ category: sp.categorie, page }),
  ]);
  const qs = (p: number) => `/actualites?${new URLSearchParams({ ...(sp.categorie ? { categorie: sp.categorie } : {}), page: String(p) })}`;
  return (
    <>
      <PageHeader kicker={t.nav.news} title={t.news.title} intro={t.news.intro} />
      <section className="py-16 md:py-24">
        <div className="container-site">
          <nav aria-label="Catégories" className="mb-14 flex flex-wrap gap-2">
            {[{ slug: "", name: t.news.all }, ...categories.map((c) => ({ slug: c.slug, name: l(c.name) }))].map((c) => {
              const active = (sp.categorie ?? "") === c.slug;
              return (
                <Link key={c.slug || "all"} href={c.slug ? `/actualites?categorie=${c.slug}` : "/actualites"} aria-current={active ? "page" : undefined}
                  className={cn("rounded-full px-4 py-2 text-sm font-bold transition-colors", active ? "bg-flag text-white" : "bg-navy-50 text-navy-900 hover:bg-flag-100")}>
                  {c.name}
                </Link>
              );
            })}
          </nav>
          {items.length === 0 ? <p className="text-muted">{t.common.noContent}</p> : (
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => <ArticleCard key={a.id} a={a} locale={locale} />)}
            </div>
          )}
          <Pagination page={page} pages={pages} href={qs} labels={t.common} />
        </div>
      </section>
    </>
  );
}
