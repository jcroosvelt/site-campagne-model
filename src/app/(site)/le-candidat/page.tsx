import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { galleryItems } from "@/lib/queries";
import { Photo } from "@/components/ui/Photo";
import { Markdown } from "@/components/ui/Markdown";
import { Placeholder, isPlaceholder } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.candidate.title };
}

function Timeline({ title, items, l }: { title: string; items: { period: string; title: unknown; organization?: string; institution?: string }[]; l: (v: unknown) => string }) {
  if (!items.length) return null;
  return (
    <section className="border-t border-line pt-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ol className="mt-8 space-y-8 border-l border-gold-500/50 pl-8">
        {items.map((it, i) => (
          <li key={i} className="relative">
            <span className="absolute top-2 -left-[2.3rem] h-2.5 w-2.5 rounded-full border-2 border-gold-500 bg-white" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson-600">{it.period}</p>
            <p className="mt-1.5 font-serif text-lg font-semibold text-navy-900">{l(it.title)}</p>
            <p className="text-muted">{it.organization ?? it.institution}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function CandidatePage() {
  const { t, l } = await getDictionary();
  const [site, c, photos] = await Promise.all([getSetting("site"), getSetting("candidate"), galleryItems({ type: "PHOTO", take: 6 })]);
  return (
    <>
      <header className="relative bg-navy-900 text-white">
        <div className="container-site grid gap-12 pt-32 pb-0 lg:grid-cols-12 lg:pt-40">
          <div className="pb-16 lg:col-span-7 lg:pb-24">
            <p className="kicker kicker-light mb-5 animate-rise">{t.candidate.title}</p>
            <h1 className="display text-white animate-rise delay-1">{site.candidateName}</h1>
            <p className="mt-4 font-serif text-xl text-gold-300 italic animate-rise delay-2">{l(c.role)}</p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 animate-rise delay-3">{l(c.intro)}</p>
            {isPlaceholder(l(c.intro)) && <p className="mt-6"><Placeholder show text={t.common.placeholderNotice} /></p>}
          </div>
          <div className="relative lg:col-span-5 lg:self-end">
            <Photo src={c.portrait} alt={site.candidateName} label={c.portrait ? undefined : t.hero.photoPending} variant="portrait" priority className="aspect-[4/5] w-full" sizes="(min-width:1024px) 40vw, 100vw" />
          </div>
        </div>
        <div className="h-1 bg-crimson-600"><div className="h-full w-24 bg-gold-500" /></div>
      </header>

      <div className="container-site grid gap-16 py-20 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <nav aria-label="Sommaire" className="sticky top-28 hidden space-y-3 text-sm lg:block">
            {[
              ["bio", t.candidate.biography],
              ["parcours", t.candidate.education],
              ["engagements", t.candidate.commitments],
              ["realisations", t.candidate.achievements],
              ["message", t.candidate.personalMessage],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block border-l-2 border-line pl-4 text-muted transition-colors hover:border-gold-500 hover:text-navy-900">{label}</a>
            ))}
          </nav>
        </aside>
        <div className="space-y-16 lg:col-span-8">
          <section id="bio" className="scroll-mt-28">
            <h2 className="text-3xl font-semibold">{t.candidate.biography}</h2>
            <div className="mt-6"><Markdown>{l(c.biography)}</Markdown></div>
          </section>
          <div id="parcours" className="scroll-mt-28 space-y-12">
            <Timeline title={t.candidate.education} items={c.education} l={l} />
            <Timeline title={t.candidate.career} items={c.career} l={l} />
            <Timeline title={t.candidate.publicService} items={c.publicService} l={l} />
          </div>
          {c.commitments.length > 0 && (
            <section id="engagements" className="scroll-mt-28 border-t border-line pt-10">
              <h2 className="text-2xl font-semibold">{t.candidate.commitments}</h2>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2">
                {c.commitments.map((x, i) => (
                  <li key={i} className="flex gap-4 bg-ivory p-6">
                    <span className="font-serif text-2xl font-semibold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                    <span className="pt-1 text-navy-900">{l(x.text)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section id="realisations" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold">{t.candidate.achievements}</h2>
            {c.achievements.length ? (
              <ul className="mt-8 divide-y divide-line">
                {c.achievements.map((a, i) => (
                  <li key={i} className="grid gap-2 py-6 sm:grid-cols-[6rem_1fr]">
                    <span className="font-serif text-lg font-semibold text-crimson-600">{a.year}</span>
                    <div>
                      <p className="font-serif text-lg font-semibold text-navy-900">{l(a.title)}</p>
                      <p className="mt-1 text-muted">{l(a.text)}</p>
                      {a.sourceUrl && (
                        <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-700 underline decoration-gold-500 underline-offset-4">
                          {t.candidate.source} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-muted">{t.common.noContent}</p>
            )}
          </section>
          <section id="message" className="scroll-mt-28 bg-navy-900 p-10 text-white md:p-14">
            <p className="kicker kicker-light mb-6">{t.candidate.personalMessage}</p>
            <Markdown className="prose-campaign font-serif text-xl leading-relaxed text-white [&_strong]:text-white">{l(c.personalMessage)}</Markdown>
            <p className="mt-8 font-serif text-lg text-gold-300 italic">— {site.candidateName}</p>
          </section>
          {photos.length > 0 && (
            <section className="border-t border-line pt-10">
              <h2 className="text-2xl font-semibold">{t.candidate.gallery}</h2>
              <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {photos.map((p) => (
                  <li key={p.id}><Photo src={p.imageUrl} alt={l(p.title)} className="aspect-square" sizes="(min-width:768px) 20vw, 50vw" /></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
