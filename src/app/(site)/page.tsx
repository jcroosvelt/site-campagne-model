import Link from "next/link";
import { ArrowRight, Heart, Play } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { galleryItems, listArticles, publishedThemes, upcomingEvents } from "@/lib/queries";
import { Photo } from "@/components/ui/Photo";
import { Markdown } from "@/components/ui/Markdown";
import { SectionHeading, isPlaceholder, Placeholder } from "@/components/ui/Section";
import { ThemeIcon } from "@/components/ui/icons";
import { ArticleCard, EventRow } from "@/components/site/cards";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { signTimestamp } from "@/lib/antispam";
import { youtubeThumb } from "@/lib/utils";

export default async function HomePage() {
  const { t, l, locale } = await getDictionary();
  const [site, home, themes, news, events, media] = await Promise.all([
    getSetting("site"),
    getSetting("home"),
    publishedThemes(),
    listArticles({ take: 3 }),
    upcomingEvents(4),
    galleryItems({ take: 5 }),
  ]);
  const [lead, ...rest] = news.items;
  const strip = (s: string) => s.replace("[À COMPLÉTER] ", "");

  return (
    <>
      {/* ───────────── Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container-site relative grid min-h-[100svh] items-center gap-12 pt-28 pb-16 lg:grid-cols-12 lg:gap-8 lg:pt-24">
          <div className="lg:col-span-7">
            <p className="kicker kicker-light animate-rise">{strip(l(site.electionLabel))}</p>
            <h1 className="mt-6 font-serif text-5xl leading-[1.02] font-semibold text-white animate-rise delay-1 sm:text-6xl xl:text-7xl">{site.candidateName}</h1>
            <p className="mt-6 font-serif text-2xl leading-snug text-gold-300 italic animate-rise delay-2 sm:text-3xl">{l(site.slogan)}</p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 animate-rise delay-3">{l(site.heroMessage)}</p>
            <div className="mt-10 flex flex-col gap-3 animate-rise delay-4 sm:flex-row sm:flex-wrap">
              <Link href="/programme" className="btn btn-light">{t.hero.discover} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/rejoindre" className="btn btn-outline-light">{t.hero.join}</Link>
            </div>
            <div className="mt-4 animate-rise delay-4">
              <Link href="/faire-un-don" className="btn btn-donate w-full py-4 sm:w-auto sm:px-8">
                <Heart className="h-4 w-4" fill="currentColor" aria-hidden /> {t.hero.donate}
              </Link>
            </div>
            {isPlaceholder(l(site.heroMessage)) && <p className="mt-8"><Placeholder show text={t.common.placeholderNotice} /></p>}
          </div>
          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
            <div className="absolute -right-4 -bottom-4 h-full w-full border border-gold-500/50" aria-hidden />
            <Photo
              src={site.heroImage}
              alt={site.candidateName}
              label={site.heroImage ? undefined : t.hero.photoPending}
              variant="portrait"
              priority
              sizes="(min-width:1024px) 40vw, 90vw"
              className="relative aspect-[4/5] w-full"
            />
            <div className="absolute -bottom-px left-0 h-1 w-1/3 bg-crimson-600" aria-hidden />
          </div>
        </div>
      </section>

      {/* ───────────── 1. Message du candidat */}
      <section className="bg-ivory py-24 md:py-32">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker mb-5">{t.home.messageKicker}</p>
            <h2 className="h2">{l(home.messageTitle)}</h2>
            <span className="mt-8 block font-serif text-[9rem] leading-none text-gold-500/40 select-none" aria-hidden>“</span>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Markdown className="prose-campaign font-serif text-xl leading-[1.75] text-navy-900">{l(home.messageBody)}</Markdown>
            <p className="mt-10 border-t border-gold-500/40 pt-6 font-serif text-lg font-semibold text-navy-900 italic">— {home.messageSignature}</p>
          </div>
        </div>
      </section>

      {/* ───────────── 2. Vision */}
      <section className="py-24 md:py-32">
        <div className="container-site">
          <SectionHeading
            kicker={t.home.visionKicker}
            title={l(home.visionTitle)}
            intro={l(home.visionBody)}
            action={<Link href="/notre-vision" className="btn btn-outline">{t.common.readMore} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          />
          <ol className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {home.visionPillars.map((p, i) => (
              <li key={i} className="bg-white p-8 lg:p-10">
                <span className="font-serif text-sm font-semibold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-2xl font-semibold">{l(p.title)}</h3>
                <p className="mt-4 leading-relaxed text-muted">{l(p.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── 3. Priorités du programme */}
      {themes.length > 0 && (
        <section className="bg-navy-50 py-24 md:py-32">
          <div className="container-site">
            <SectionHeading
              kicker={t.home.prioritiesKicker}
              title={t.home.prioritiesTitle}
              action={<Link href="/programme" className="btn btn-primary">{t.program.allThemes} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            />
            <ul className="grid border-t border-navy-900/10 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((th) => (
                <li key={th.id} className="group relative border-b border-navy-900/10 sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                  <Link href={`/programme/${th.slug}`} className="flex h-full gap-5 p-7 transition-colors duration-300 hover:bg-white">
                    <ThemeIcon name={th.icon} className="h-7 w-7 shrink-0 text-crimson-600" />
                    <span>
                      <span className="block font-serif text-xl font-semibold text-navy-900">{l(th.title)}</span>
                      <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted">{l(th.summary)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────────── 4. Actualités */}
      <section className="py-24 md:py-32">
        <div className="container-site">
          <SectionHeading
            kicker={t.home.newsKicker}
            title={t.home.newsTitle}
            action={<Link href="/actualites" className="btn btn-outline">{t.common.seeAll} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          />
          {lead ? (
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7"><ArticleCard a={lead} locale={locale} size="lg" /></div>
              <div className="space-y-12 lg:col-span-5">{rest.map((a) => <ArticleCard key={a.id} a={a} locale={locale} />)}</div>
            </div>
          ) : (
            <p className="text-muted">{t.common.noContent}</p>
          )}
        </div>
      </section>

      {/* ───────────── 5. Prochains événements */}
      <section className="bg-navy-900 py-24 text-white md:py-32">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker kicker-light mb-5">{t.home.eventsKicker}</p>
            <h2 className="h2 text-white">{t.home.eventsTitle}</h2>
            <Link href="/agenda" className="btn btn-outline-light mt-10">{t.common.seeAll} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="lg:col-span-8">
            {events.length ? events.map((e) => <EventRow key={e.id} e={e} locale={locale} t={t} light />) : <p className="border-t border-white/10 pt-6 text-white/60">{t.home.noEvents}</p>}
          </div>
        </div>
      </section>

      {/* ───────────── 6. Galerie */}
      {media.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-site">
            <SectionHeading
              kicker={t.home.galleryKicker}
              title={t.home.galleryTitle}
              action={<Link href="/galerie" className="btn btn-outline">{t.common.seeAll} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            />
            <ul className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
              {media.map((m, i) => (
                <li key={m.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                  <Link href="/galerie" className="group relative block h-full overflow-hidden">
                    <Photo src={m.imageUrl || youtubeThumb(m.videoUrl)} alt={l(m.title)} className="h-full w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]" sizes="(min-width:768px) 25vw, 50vw" />
                    {m.type === "VIDEO" && <span className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy-900"><Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden /></span>}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-4 pt-10 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">{l(m.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────────── 7. Participation citoyenne */}
      <section className="relative overflow-hidden bg-crimson-600 py-24 text-white md:py-28">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-crimson-700/40 [clip-path:polygon(25%_0,100%_0,100%_100%,0_100%)]" aria-hidden />
        <div className="container-site relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="kicker mb-5 text-white before:bg-white/60">{t.home.participationKicker}</p>
            <h2 className="h2 text-white">{l(home.participationTitle)}</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">{l(home.participationBody)}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link href="/rejoindre" className="btn btn-light">{t.home.volunteer} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/contact" className="btn btn-outline-light">{t.home.contactUs}</Link>
          </div>
        </div>
      </section>

      {/* ───────────── 8. Soutien financier */}
      <section className="bg-ivory py-24 md:py-32">
        <div className="container-site grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker mb-5">{t.home.donationKicker}</p>
            <h2 className="h2">{l(home.donationTitle)}</h2>
            <p className="lead mt-5 max-w-xl">{l(home.donationBody)}</p>
          </div>
          <div className="border-l-2 border-gold-500 pl-8 lg:col-span-4 lg:col-start-9">
            <ul className="space-y-2 text-sm text-navy-900">
              <li>— {t.donate.trust1}</li>
              <li>— {t.donate.trust2}</li>
              <li>— {t.donate.trust3}</li>
            </ul>
            <Link href="/faire-un-don" className="btn btn-donate mt-8 w-full py-4">
              <Heart className="h-4 w-4" fill="currentColor" aria-hidden /> {t.home.donateCta}
            </Link>
            <Link href="/transparence" className="mt-4 inline-block text-sm text-navy-700 underline decoration-gold-500 underline-offset-4">{t.footer.transparency}</Link>
          </div>
        </div>
      </section>

      {/* ───────────── 9. Newsletter */}
      <section className="py-24">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="kicker mb-5">{t.home.newsletterKicker}</p>
            <h2 className="h2">{l(home.newsletterTitle)}</h2>
            <p className="lead mt-4">{l(home.newsletterBody)}</p>
          </div>
          <NewsletterForm t={t} ts={signTimestamp()} />
        </div>
      </section>
    </>
  );
}
