import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Article, ArticleCategory, Event } from "@prisma/client";
import { Photo } from "@/components/ui/Photo";
import { formatDate, formatTime } from "@/lib/utils";
import { localize, type Locale } from "@/lib/i18n-shared-server";
import type { Dictionary } from "@/lib/i18n";

type ArticleWithCategory = Article & { category: ArticleCategory | null };

function ArticleMeta({ a, locale }: { a: ArticleWithCategory; locale: Locale }) {
  return (
    <p className="flex flex-wrap gap-x-3 text-sm">
      {a.category && <span className="font-bold text-crimson-600">{localize(a.category.name, locale)}</span>}
      {a.publishedAt && <time dateTime={a.publishedAt.toISOString()} className="text-muted">{formatDate(a.publishedAt, locale)}</time>}
    </p>
  );
}

export function ArticleCard({ a, locale, size = "md" }: { a: ArticleWithCategory; locale: Locale; size?: "lg" | "md" }) {
  const title = localize(a.title, locale);
  return (
    <article className="group relative flex flex-col">
      <Photo
        src={a.coverImage}
        alt={a.coverAlt || title}
        className={`${size === "lg" ? "aspect-[16/10] rounded-[1.75rem]" : "aspect-[3/2] rounded-2xl"} transition-transform duration-500 ease-out-soft group-hover:-translate-y-1`}
        sizes={size === "lg" ? "(min-width:1024px) 60vw, 100vw" : "(min-width:1024px) 30vw, 100vw"}
      />
      <div className="mt-5"><ArticleMeta a={a} locale={locale} /></div>
      <h3 className={size === "lg" ? "mt-2 text-4xl font-extrabold condensed sm:text-5xl" : "mt-2 text-2xl font-extrabold"}>
        <Link href={`/actualites/${a.slug}`} className="after:absolute after:inset-0 group-hover:text-flag">{title}</Link>
      </h3>
      <p className="mt-3 line-clamp-3 max-w-2xl leading-relaxed text-muted">{localize(a.excerpt, locale)}</p>
    </article>
  );
}

/** Variante compacte (liste à côté de l'article principal). */
export function ArticleRow({ a, locale }: { a: ArticleWithCategory; locale: Locale }) {
  const title = localize(a.title, locale);
  return (
    <article className="group relative grid grid-cols-[7rem_1fr] gap-5 py-6 first:pt-0">
      <Photo src={a.coverImage} alt={a.coverAlt || title} className="aspect-square rounded-xl" sizes="112px" />
      <div>
        <ArticleMeta a={a} locale={locale} />
        <h3 className="mt-1.5 text-xl font-extrabold">
          <Link href={`/actualites/${a.slug}`} className="after:absolute after:inset-0 group-hover:text-flag">{title}</Link>
        </h3>
      </div>
    </article>
  );
}

export function EventRow({ e, locale, t, light }: { e: Event; locale: Locale; t: Dictionary; light?: boolean }) {
  const day = formatDate(e.startsAt, locale, { day: "numeric" });
  const month = formatDate(e.startsAt, locale, { month: "short" }).replace(".", "");
  return (
    <article
      className={`group relative grid grid-cols-[4.75rem_1fr_auto] items-center gap-5 rounded-2xl p-4 transition-colors sm:gap-7 sm:p-5 ${
        light ? "bg-white/[0.06] hover:bg-white/[0.12]" : "bg-navy-50 hover:bg-flag-100"
      }`}
    >
      <div className="flex aspect-square flex-col items-center justify-center rounded-xl bg-crimson-600 text-white">
        <span className="text-[2.1rem] leading-none font-black condensed">{day}</span>
        <span className="mt-0.5 text-sm font-semibold">{month}</span>
      </div>
      <div>
        <p className={`text-sm font-semibold ${light ? "text-gold-300" : "text-crimson-600"}`}>
          {t.agenda.types[e.type]}, {formatTime(e.startsAt, locale)}
        </p>
        <h3 className={`mt-1 text-xl font-extrabold sm:text-2xl ${light ? "text-white" : ""}`}>
          <Link href={`/agenda/${e.slug}`} className="after:absolute after:inset-0">{localize(e.title, locale)}</Link>
        </h3>
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${light ? "text-white/70" : "text-muted"}`}>
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {e.venue.replace("[À COMPLÉTER] ", "")}, {e.city}
        </p>
      </div>
      <ArrowUpRight className={`hidden h-6 w-6 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block ${light ? "text-white" : "text-flag"}`} aria-hidden />
    </article>
  );
}
