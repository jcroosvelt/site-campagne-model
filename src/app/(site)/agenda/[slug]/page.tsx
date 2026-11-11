import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, seatsTaken } from "@/lib/queries";
import { getDictionary } from "@/lib/i18n";
import { formatDate, formatTime } from "@/lib/utils";
import { env } from "@/lib/env";
import { signTimestamp } from "@/lib/antispam";
import { Markdown } from "@/components/ui/Markdown";
import { Photo } from "@/components/ui/Photo";
import { ShareButtons } from "@/components/site/ShareButtons";
import { EventRegistrationForm } from "@/components/forms/EventRegistrationForm";

type Props = { params: Promise<{ slug: string }> };
const load = getEvent;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { l } = await getDictionary();
  const e = await load((await params).slug);
  return e ? { title: l(e.title), description: l(e.description).slice(0, 160) } : {};
}

export default async function EventPage({ params }: Props) {
  const { t, l, locale } = await getDictionary();
  const e = await load((await params).slug);
  if (!e) notFound();
  const isPast = (e.endsAt ?? e.startsAt) < new Date();
  let full = false;
  if (e.capacity) {
    full = (await seatsTaken(e.id)) >= e.capacity;
  }
  const title = l(e.title);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt?.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.venue, address: [e.address, e.city].filter(Boolean).join(", ") },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="bg-flag text-white">
        <div className="container-site pt-32 pb-16 md:pt-40">
          <Link href="/agenda" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"> {t.agenda.title}</Link>
          <p className="kicker kicker-light mt-10">{t.agenda.types[e.type]}</p>
          <h1 className="display mt-5 max-w-4xl text-white">{title}</h1>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-white/80">
            <div className="flex items-center gap-2"><dt className="sr-only">{t.agenda.date}</dt> <dd className="capitalize">{formatDate(e.startsAt, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {formatTime(e.startsAt, locale)}{e.endsAt ? ` – ${formatTime(e.endsAt, locale)}` : ""}</dd></div>
            <div className="flex items-center gap-2"><dt className="sr-only">{t.agenda.location}</dt> <dd>{e.venue}, {e.address ? `${e.address}, ` : ""}{e.city}</dd></div>
          </dl>
        </div>
        <div className="h-5 bg-crimson-600" aria-hidden />
      </header>
      <div className="container-site grid gap-16 py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {e.image && <Photo src={e.image} alt={title} className="mb-10 aspect-[16/9]" sizes="(min-width:1024px) 55vw, 100vw" />}
          <Markdown>{l(e.description)}</Markdown>
          <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-line pt-8">
            <a href={`/agenda/${e.slug}/ics`} className="btn btn-outline btn-sm"> {t.agenda.addToCalendar}</a>
            <ShareButtons url={`${env.appUrl()}/agenda/${e.slug}`} title={title} labels={t.common} />
          </div>
        </div>
        {e.registrationEnabled && (
          <aside className="lg:col-span-5">
            <div className="sticky top-28 border border-line bg-ivory p-8">
              <h2 className="mb-6 text-2xl font-semibold">{t.agenda.register}</h2>
              {isPast ? <p className="text-muted">{t.agenda.registrationClosed}</p> : full ? <p className="text-muted">{t.agenda.full}</p> : <EventRegistrationForm t={t} ts={signTimestamp()} eventId={e.id} />}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
