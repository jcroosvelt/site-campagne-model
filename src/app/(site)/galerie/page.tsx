import type { Metadata } from "next";
import Link from "next/link";
import type { MediaCategory, MediaType } from "@prisma/client";
import { getDictionary } from "@/lib/i18n";
import { galleryItems } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { cn, toVideoEmbed, youtubeThumb } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.gallery.title, description: t.gallery.intro };
}

const CATS: MediaCategory[] = ["MEETING", "VISIT", "INTERVIEW", "CONFERENCE", "OTHER"];
type Props = { searchParams: Promise<{ type?: string; categorie?: string }> };

export default async function GalleryPage({ searchParams }: Props) {
  const { t, l } = await getDictionary();
  const sp = await searchParams;
  const type = sp.type === "PHOTO" || sp.type === "VIDEO" ? (sp.type as MediaType) : undefined;
  const category = CATS.includes(sp.categorie as MediaCategory) ? (sp.categorie as MediaCategory) : undefined;
  const items = await galleryItems({ type, category });
  const link = (p: { type?: string; categorie?: string }) => {
    const q = new URLSearchParams(Object.entries({ type, categorie: category, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/galerie${q.size ? `?${q}` : ""}`;
  };
  const pill = (active: boolean) => cn("rounded-full px-4 py-2 text-sm font-bold transition-colors", active ? "bg-flag text-white" : "bg-navy-50 text-navy-900 hover:bg-flag-100");

  return (
    <>
      <PageHeader kicker={t.nav.gallery} title={t.gallery.title} intro={t.gallery.intro} />
      <section className="py-16 md:py-24">
        <div className="container-site">
          <div className="mb-12 flex flex-col gap-4">
            <nav aria-label="Type" className="flex flex-wrap gap-2">
              <Link href={link({ type: "" })} className={pill(!type)}>{t.gallery.all}</Link>
              <Link href={link({ type: "PHOTO" })} className={pill(type === "PHOTO")}>{t.gallery.photos}</Link>
              <Link href={link({ type: "VIDEO" })} className={pill(type === "VIDEO")}>{t.gallery.videos}</Link>
            </nav>
            <nav aria-label="Catégories" className="flex flex-wrap gap-2">
              <Link href={link({ categorie: "" })} className={cn(pill(!category), "text-xs")}>{t.gallery.all}</Link>
              {CATS.map((c) => <Link key={c} href={link({ categorie: c })} className={cn(pill(category === c), "text-xs")}>{t.gallery.categories[c]}</Link>)}
            </nav>
          </div>
          {items.length === 0 ? (
            <p className="text-muted">{t.common.noContent}</p>
          ) : (
            <GalleryGrid
              labels={{ close: t.nav.close, previous: t.common.previous, next: t.common.next, open: t.gallery.open, video: t.news.video }}
              items={items.map((m) => ({
                id: m.id,
                type: m.type,
                title: l(m.title),
                image: m.imageUrl || youtubeThumb(m.videoUrl),
                embed: toVideoEmbed(m.videoUrl),
                category: t.gallery.categories[m.category],
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
