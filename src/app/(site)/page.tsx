import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { galleryItems, listArticles, publishedThemes, upcomingEvents } from "@/lib/queries";
import { Photo } from "@/components/ui/Photo";
import { Markdown } from "@/components/ui/Markdown";
import { SectionHeading } from "@/components/ui/Section";
import { ArticleCard, ArticleRow, EventRow } from "@/components/site/cards";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { signTimestamp } from "@/lib/antispam";
import { youtubeThumb } from "@/lib/utils";

export default async function HomePage() {
  const { t, l, locale } = await getDictionary();
  const [site, home, themes, news, events, media] = await Promise.all([
    getSetting("site"),
    getSetting("home"),
    publishedThemes(),
    listArticles({ take: 4 }),
    upcomingEvents(4),
    galleryItems({ take: 5 }),
  ]);
  const [lead, ...rest] = news.items;
  const name = site.candidateName || site.campaignName || t.hero.defaultTitle;
  const hasPortrait = Boolean(site.heroImage);
  const hasMessage = Boolean(l(home.messageBody));
  const hasVision = Boolean(l(home.visionTitle) || l(home.visionBody) || home.visionPillars.length);

  return (
    <>
      {/* ───────── Affiche : bande bleue, bande rouge, nom à cheval sur les deux */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="relative flex flex-1 items-end bg-flag">
          <div className="hero-band absolute inset-0 bg-flag" aria-hidden />
          <div className="container-site relative pt-28 lg:pt-32">
            <div className="lg:max-w-[60%]">
              {l(site.electionLabel) && <p className="hero-rise text-lg font-semibold text-white/80">{l(site.electionLabel)}</p>}
              {hasPortrait && (
                <div className="hero-portrait mx-auto mt-6 w-3/4 max-w-xs lg:hidden">
                  <Photo src={site.heroImage} alt={name} variant="portrait" priority className="aspect-[4/5] rounded-t-full" sizes="75vw" />
                </div>
              )}
              <h1 className="hero-rise relative z-10 mt-6 -mb-[0.34em] text-[clamp(3.6rem,10.5vw,9.75rem)] leading-[0.84] font-black text-white condensed">
                {name}
              </h1>
            </div>
          </div>
        </div>
        <div className="relative bg-crimson-600">
          <div className="hero-band-2 absolute inset-0 bg-crimson-600" aria-hidden />
          <div className="container-site relative pt-[clamp(2.5rem,5vw,4.5rem)] pb-12 lg:pb-16">
            <div className="hero-rise-2 lg:max-w-[56%]">
              {l(site.slogan) && <p className="text-2xl leading-snug font-bold text-white semi-condensed sm:text-3xl">{l(site.slogan)}</p>}
              {l(site.heroMessage) && <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">{l(site.heroMessage)}</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/faire-un-don" className="btn btn-donate py-4 text-base"> {t.hero.donate}
                </Link>
                <Link href="/programme" className="btn btn-light">{t.hero.discover}</Link>
                <Link href="/rejoindre" className="btn btn-outline-light">{t.hero.join}</Link>
              </div>
            </div>
          </div>
        </div>
        {/* Portrait en arche, qui chevauche les deux bandes (grand écran) */}
        {hasPortrait && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="container-site relative h-full">
              <div className="hero-portrait absolute right-12 bottom-0 w-[min(34vw,30rem)]">
                <Photo src={site.heroImage} alt={name} variant="portrait" priority className="aspect-[4/5] rounded-t-full shadow-poster ring-[10px] ring-white" sizes="34vw" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ───────── Message du candidat */}
      {hasMessage && (
      <section className="py-24 md:py-32">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker mb-3">{t.home.messageKicker}</p>
            <h2 className="h2">{l(home.messageTitle) || t.home.messageKicker}</h2>
          </div>
          <div className="flex gap-6 lg:col-span-7 lg:col-start-6 md:gap-10">
            <div className="flex w-1.5 shrink-0 flex-col overflow-hidden rounded-full" aria-hidden>
              <span className="flex-1 bg-flag" />
              <span className="flex-1 bg-crimson-600" />
            </div>
            <div>
              <Markdown className="prose-campaign text-xl leading-[1.7] sm:text-[1.35rem]">{l(home.messageBody)}</Markdown>
              {home.messageSignature && <p className="mt-8 text-lg font-extrabold text-navy-900">{home.messageSignature}</p>}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ───────── Vision */}
      {hasVision && (
      <section className="bg-navy-50 py-24 md:py-32">
        <div className="container-site">
          <SectionHeading
            kicker={t.home.visionKicker}
            title={l(home.visionTitle) || t.home.visionKicker}
            intro={l(home.visionBody) || undefined}
            action={<Link href="/notre-vision" className="btn btn-outline">{t.common.readMore}</Link>}
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {home.visionPillars.map((p, i) => (
              <li key={i} className="relative overflow-hidden rounded-3xl bg-white p-8 pt-10 lg:p-10 lg:pt-12">
                <span className={`absolute inset-x-0 top-0 h-2 ${i % 2 ? "bg-crimson-600" : "bg-flag"}`} aria-hidden />
                <h3 className="text-3xl font-extrabold condensed">{l(p.title)}</h3>
                <p className="mt-4 leading-relaxed text-muted">{l(p.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* ───────── Priorités : le programme en un mur de mots */}
      {themes.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-site">
            <SectionHeading kicker={t.home.prioritiesKicker} title={t.home.prioritiesTitle} action={<Link href="/programme" className="btn btn-primary">{t.program.allThemes}</Link>} />
            <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2 sm:gap-x-7">
              {themes.map((th, i) => (
                <li key={th.id} className="flex items-baseline gap-5 sm:gap-7">
                  <Link
                    href={`/programme/${th.slug}`}
                    title={l(th.summary) || undefined}
                    className="text-[2.6rem] leading-[1.05] font-black text-navy-900 condensed decoration-crimson-600 decoration-[6px] underline-offset-[10px] transition-colors hover:text-flag hover:underline sm:text-6xl lg:text-7xl"
                  >
                    {l(th.title)}
                  </Link>
                  {i < themes.length - 1 && <span className="h-3 w-3 shrink-0 rounded-full bg-crimson-600" aria-hidden />}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────── Actualités */}
      <section className="bg-navy-50 py-24 md:py-32">
        <div className="container-site">
          <SectionHeading kicker={t.home.newsKicker} title={t.home.newsTitle} action={<Link href="/actualites" className="btn btn-outline">{t.common.seeAll}</Link>} />
          {lead ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7"><ArticleCard a={lead} locale={locale} size="lg" /></div>
              {rest.length > 0 && <div className="divide-y divide-line lg:col-span-5">{rest.map((a) => <ArticleRow key={a.id} a={a} locale={locale} />)}</div>}
            </div>
          ) : (
            <p className="text-muted">{t.common.noContent}</p>
          )}
        </div>
      </section>

      {/* ───────── Agenda */}
      <section className="bg-navy-900 py-24 text-white md:py-32">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker kicker-light mb-3">{t.home.eventsKicker}</p>
            <h2 className="h2 text-white">{t.home.eventsTitle}</h2>
            <Link href="/agenda" className="btn btn-outline-light mt-8">{t.common.seeAll}</Link>
          </div>
          <div className="space-y-3 lg:col-span-8">
            {events.length ? events.map((e) => <EventRow key={e.id} e={e} locale={locale} t={t} light />) : <p className="text-white/70">{t.home.noEvents}</p>}
          </div>
        </div>
      </section>

      {/* ───────── Galerie */}
      {media.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-site">
            <SectionHeading kicker={t.home.galleryKicker} title={t.home.galleryTitle} action={<Link href="/galerie" className="btn btn-outline">{t.common.seeAll}</Link>} />
            <ul className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-4">
              {media.map((m, i) => (
                <li key={m.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                  <Link href="/galerie" className="group relative block h-full overflow-hidden rounded-2xl">
                    <Photo src={m.imageUrl || youtubeThumb(m.videoUrl)} alt={l(m.title)} className="h-full w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]" sizes="(min-width:768px) 25vw, 50vw" />
                    {m.type === "VIDEO" && <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-flag">{t.news.video}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────── Participation */}
      <section className="bg-crimson-600 py-24 text-white md:py-28">
        <div className="container-site grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="text-5xl leading-[0.92] font-black text-white condensed sm:text-7xl lg:text-8xl">{l(home.participationTitle) || t.home.participationKicker}</h2>
            {l(home.participationBody) && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">{l(home.participationBody)}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-stretch">
            <Link href="/rejoindre" className="btn btn-light py-4 text-base">{t.home.volunteer}</Link>
            <Link href="/contact" className="btn btn-outline-light py-4 text-base">{t.home.contactUs}</Link>
          </div>
        </div>
      </section>

      {/* ───────── Soutien financier */}
      <section className="py-24 md:py-32">
        <div className="container-site grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="kicker mb-3">{t.home.donationKicker}</p>
            <h2 className="h2">{l(home.donationTitle) || t.donate.title}</h2>
            {l(home.donationBody) && <p className="lead mt-5 max-w-xl">{l(home.donationBody)}</p>}
          </div>
          <div className="rounded-[2rem] bg-flag p-8 text-white shadow-poster sm:p-10 lg:col-span-5 lg:col-start-8">
            <ul className="space-y-3 text-lg font-semibold">
              {[t.donate.trust1, t.donate.trust2, t.donate.trust3].map((x) => (
                <li key={x} className="flex items-center gap-3"> {x}</li>
              ))}
            </ul>
            <Link href="/faire-un-don" className="btn btn-donate mt-8 w-full py-4 text-base"> {t.home.donateCta}
            </Link>
            <Link href="/transparence" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 underline decoration-white/40 underline-offset-4 hover:text-white">
              {t.footer.transparency} </Link>
          </div>
        </div>
      </section>

      {/* ───────── Newsletter */}
      <section className="pb-24 md:pb-32">
        <div className="container-site">
          <div className="grid gap-10 rounded-[2rem] bg-navy-50 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-16">
            <div>
              <h2 className="h2">{l(home.newsletterTitle) || t.home.newsletterKicker}</h2>
              {l(home.newsletterBody) && <p className="lead mt-4">{l(home.newsletterBody)}</p>}
            </div>
            <NewsletterForm t={t} ts={signTimestamp()} />
          </div>
        </div>
      </section>
    </>
  );
}
