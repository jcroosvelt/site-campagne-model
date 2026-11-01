import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Article, ArticleCategory, Event } from "@prisma/client";
import { Photo } from "@/components/ui/Photo";
import { formatDate, formatTime } from "@/lib/utils";
import { localize, type Locale } from "@/lib/i18n-shared-server";
import type { Dictionary } from "@/lib/i18n";

export function ArticleCard({ a, locale, size = "md" }: { a: Article & { category: ArticleCategory | null }; locale: Locale; size?: "lg" | "md" }) {
  const title = localize(a.title, locale);
  return (
    <article className="group relative flex flex-col">
      <Photo
        src={a.coverImage}
        alt={a.coverAlt || title}
        className={size === "lg" ? "aspect-[16/10]" : "aspect-[3/2]"}
        sizes={size === "lg" ? "(min-width:1024px) 60vw, 100vw" : "(min-width:1024px) 30vw, 100vw"}
      />
      <div className="mt-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        {a.category && <span className="text-crimson-600">{localize(a.category.name, locale)}</span>}
        {a.publishedAt && <time dateTime={a.publishedAt.toISOString()}>{formatDate(a.publishedAt, locale)}</time>}
      </div>
      <h3 className={size === "lg" ? "mt-3 text-3xl leading-tight font-semibold" : "mt-3 text-xl leading-snug font-semibold"}>
        <Link href={`/actualites/${a.slug}`} className="after:absolute after:inset-0">
          <span className="link-underline">{title}</span>
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-muted">{localize(a.excerpt, locale)}</p>
    </article>
  );
}

export function EventRow({ e, locale, t, light }: { e: Event; locale: Locale; t: Dictionary; light?: boolean }) {
  const day = formatDate(e.startsAt, locale, { day: "2-digit" });
  const month = formatDate(e.startsAt, locale, { month: "short" });
  return (
    <article className={`group relative grid grid-cols-[4.5rem_1fr_auto] items-center gap-6 border-t py-6 ${light ? "border-white/10" : "border-line"}`}>
      <div className="text-center">
        <p className={`font-serif text-4xl leading-none font-semibold ${light ? "text-white" : "text-navy-900"}`}>{day}</p>
        <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.18em] ${light ? "text-gold-300" : "text-crimson-600"}`}>{month.replace(".", "")}</p>
      </div>
      <div>
        <p className={`text-xs font-medium uppercase tracking-[0.15em] ${light ? "text-white/50" : "text-muted"}`}>
          {t.agenda.types[e.type]} · {formatTime(e.startsAt, locale)}
        </p>
        <h3 className={`mt-1.5 text-lg leading-snug font-semibold sm:text-xl ${light ? "text-white" : ""}`}>
          <Link href={`/agenda/${e.slug}`} className="after:absolute after:inset-0">{localize(e.title, locale)}</Link>
        </h3>
        <p className={`mt-1.5 flex items-center gap-1.5 text-sm ${light ? "text-white/60" : "text-muted"}`}>
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {e.venue}, {e.city}
        </p>
      </div>
      <ArrowUpRight className={`h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${light ? "text-gold-300" : "text-navy-900"}`} aria-hidden />
    </article>
  );
}
