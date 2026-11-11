import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { galleryItems } from "@/lib/queries";
import { Photo } from "@/components/ui/Photo";
import { Markdown } from "@/components/ui/Markdown";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.candidate.title };
}

function Timeline({ title, items, l }: { title: string; items: { period: string; title: unknown; organization?: string; institution?: string }[]; l: (v: unknown) => string }) {
  if (!items.length) return null;
  return (
    <section className="border-t border-line pt-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ol className="mt-8 space-y-8 border-l-2 border-flag-100 pl-8">
        {items.map((it, i) => (
          <li key={i} className="relative">
            <span className="absolute top-1.5 -left-[2.45rem] h-3.5 w-3.5 rounded-full border-[3px] border-flag bg-white" aria-hidden />
            <p className="text-sm font-bold text-crimson-600">{it.period}</p>
            <p className="mt-1.5 text-lg font-extrabold text-navy-900">{l(it.title)}</p>
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
  const sections = (
    [
      ["bio", t.candidate.biography, Boolean(l(c.biography))],
      ["parcours", t.candidate.education, c.education.length + c.career.length + c.publicService.length > 0],
      ["engagements", t.candidate.commitments, c.commitments.length > 0],
      ["realisations", t.candidate.achievements, c.achievements.length > 0],
      ["message", t.candidate.personalMessage, Boolean(l(c.personalMessage))],
    ] as [string, string, boolean][]
  ).filter(([, , show]) => show);
  return (
    <>
      <header className="relative bg-flag text-white">
        <div className="container-site grid gap-12 pt-32 pb-0 lg:grid-cols-12 lg:pt-40">
          <div className="pb-16 lg:col-span-7 lg:pb-24">
            <p className="kicker kicker-light mb-4">{t.candidate.title}</p>
            <h1 className="display text-white">{site.candidateName || t.candidate.title}</h1>
            {l(c.role) && <p className="mt-4 text-2xl font-bold text-white/90 semi-condensed">{l(c.role)}</p>}
            {l(c.intro) && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{l(c.intro)}</p>}
          </div>
          {c.portrait && (
            <div className="relative lg:col-span-5 lg:self-end">
              <Photo src={c.portrait} alt={site.candidateName} variant="portrait" priority className="aspect-[4/5] w-full rounded-t-full" sizes="(min-width:1024px) 40vw, 100vw" />
            </div>
          )}
        </div>
        <div className="h-5 bg-crimson-600" aria-hidden />
      </header>

      <div className="container-site grid gap-16 py-20 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <nav aria-label="Sommaire" className="sticky top-28 hidden space-y-3 text-sm lg:block">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block border-l-2 border-line pl-4 text-muted transition-colors hover:border-gold-500 hover:text-navy-900">{label}</a>
            ))}
          </nav>
        </aside>
        <div className="space-y-16 lg:col-span-8">
          {sections.length === 0 && <p className="text-muted">{t.common.noContent}</p>}
          {l(c.biography) && (
            <section id="bio" className="scroll-mt-28">
              <h2 className="text-3xl font-semibold">{t.candidate.biography}</h2>
              <div className="mt-6"><Markdown>{l(c.biography)}</Markdown></div>
            </section>
          )}
          <div id="parcours" className="scroll-mt-28 space-y-12">
            <Timeline title={t.candidate.education} items={c.education} l={l} />
            <Timeline title={t.candidate.career} items={c.career} l={l} />
            <Timeline title={t.candidate.publicService} items={c.publicService} l={l} />
          </div>
          {c.commitments.length > 0 && (
            <section id="engagements" className="scroll-mt-28 border-t border-line pt-10">
              <h2 className="text-2xl font-semibold">{t.candidate.commitments}</h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {c.commitments.map((x, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl bg-navy-50 p-6">
                    <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-crimson-600" aria-hidden />
                    <span className="text-lg font-semibold text-navy-900">{l(x.text)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {c.achievements.length > 0 && (
          <section id="realisations" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold">{t.candidate.achievements}</h2>
            {c.achievements.length ? (
              <ul className="mt-8 divide-y divide-line">
                {c.achievements.map((a, i) => (
                  <li key={i} className="grid gap-2 py-6 sm:grid-cols-[6rem_1fr]">
                    <span className="text-lg font-extrabold text-crimson-600">{a.year}</span>
                    <div>
                      <p className="text-lg font-extrabold text-navy-900">{l(a.title)}</p>
                      <p className="mt-1 text-muted">{l(a.text)}</p>
                      {a.sourceUrl && (
                        <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-700 underline decoration-gold-500 underline-offset-4">
                          {t.candidate.source} </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          )}
          {l(c.personalMessage) && (
            <section id="message" className="scroll-mt-28 rounded-[2rem] bg-flag p-10 text-white md:p-14">
              <p className="kicker kicker-light mb-5">{t.candidate.personalMessage}</p>
              <Markdown className="prose-campaign text-xl leading-relaxed text-white [&_strong]:text-white">{l(c.personalMessage)}</Markdown>
              {site.candidateName && <p className="mt-8 text-lg font-extrabold text-white">{site.candidateName}</p>}
            </section>
          )}
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
