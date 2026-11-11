import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { eventsBetween, pastEvents, upcomingEvents } from "@/lib/queries";
import { PageHeader } from "@/components/ui/Section";
import { EventRow } from "@/components/site/cards";
import { cn, formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.agenda.title, description: t.agenda.intro };
}

type Props = { searchParams: Promise<{ vue?: string; mois?: string }> };

/** Calcule les bornes d'un mois au fuseau d'Haïti (approximation UTC-5 / UTC-4 suffisante pour le classement par jour). */
function monthBounds(mois?: string) {
  const now = new Date();
  const m = mois && /^\d{4}-\d{2}$/.test(mois) ? mois : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, mo] = m.split("-").map(Number) as [number, number];
  return { y, mo, from: new Date(Date.UTC(y, mo - 1, 1, 5)), to: new Date(Date.UTC(y, mo, 1, 5)) };
}

const ym = (y: number, m: number) => {
  const d = new Date(Date.UTC(y, m - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default async function AgendaPage({ searchParams }: Props) {
  const { t, l, locale } = await getDictionary();
  const sp = await searchParams;
  const view = sp.vue === "calendrier" ? "calendar" : "list";

  return (
    <>
      <PageHeader kicker={t.nav.agenda} title={t.agenda.title} intro={t.agenda.intro} />
      <section className="py-16 md:py-24">
        <div className="container-site">
          <div className="mb-12 inline-flex rounded-full bg-navy-50 p-1" role="tablist">
            <Link href="/agenda" role="tab" aria-selected={view === "list"} className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold", view === "list" ? "bg-flag text-white" : "text-navy-900")}> {t.agenda.list}
            </Link>
            <Link href="/agenda?vue=calendrier" role="tab" aria-selected={view === "calendar"} className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold", view === "calendar" ? "bg-flag text-white" : "text-navy-900")}> {t.agenda.calendar}
            </Link>
          </div>
          {view === "list" ? <ListView /> : <CalendarView mois={sp.mois} />}
        </div>
      </section>
    </>
  );

  async function ListView() {
    const [up, past] = await Promise.all([upcomingEvents(50), pastEvents(12)]);
    return (
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="mb-4 text-2xl font-semibold">{t.agenda.upcoming}</h2>
          {up.length ? up.map((e) => <EventRow key={e.id} e={e} locale={locale} t={t} />) : <p className="border-t border-line pt-6 text-muted">{t.home.noEvents}</p>}
        </div>
        {past.length > 0 && (
          <aside className="lg:col-span-4">
            <h2 className="mb-4 text-lg font-semibold text-muted">{t.agenda.past}</h2>
            <ul className="divide-y divide-line border-t border-line">
              {past.map((e) => (
                <li key={e.id} className="py-4">
                  <p className="text-xs text-muted">{formatDate(e.startsAt, locale)} · {e.city}</p>
                  <Link href={`/agenda/${e.slug}`} className="mt-1 block font-medium text-navy-900 hover:text-crimson-600">{l(e.title)}</Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    );
  }

  async function CalendarView({ mois }: { mois?: string }) {
    const { y, mo, from, to } = monthBounds(mois);
    const events = await eventsBetween(from, to);
    const first = new Date(Date.UTC(y, mo - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7; // lundi = 0
    const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const dayKey = (d: Date) => formatDate(d, "fr", { year: "numeric", month: "2-digit", day: "2-digit" });
    const byDay = new Map<string, typeof events>();
    for (const e of events) {
      const k = dayKey(e.startsAt);
      byDay.set(k, [...(byDay.get(k) ?? []), e]);
    }
    const todayKey = dayKey(new Date());
    const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
      const n = i - offset + 1;
      return n >= 1 && n <= days ? n : null;
    });
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/agenda?vue=calendrier&mois=${ym(y, mo - 1)}`} className="rounded-full bg-navy-50 px-4 py-2 text-sm font-bold text-navy-900 hover:bg-flag-100">{t.common.previous}</Link>
          <h2 className="text-2xl font-semibold capitalize">{formatDate(new Date(Date.UTC(y, mo - 1, 15)), locale, { month: "long", year: "numeric" })}</h2>
          <Link href={`/agenda?vue=calendrier&mois=${ym(y, mo + 1)}`} className="rounded-full bg-navy-50 px-4 py-2 text-sm font-bold text-navy-900 hover:bg-flag-100">{t.common.next}</Link>
        </div>
        <div className="hidden grid-cols-7 border-t border-l border-line md:grid">
          {t.agenda.weekdays.map((w) => <div key={w} className="border-r border-b border-line bg-ivory px-3 py-2 text-sm font-bold text-muted">{w}</div>)}
          {cells.map((n, i) => {
            const k = n ? dayKey(new Date(Date.UTC(y, mo - 1, n, 12))) : "";
            const list = n ? byDay.get(k) ?? [] : [];
            return (
              <div key={i} className={cn("min-h-28 border-r border-b border-line p-2", !n && "bg-navy-50/40")}>
                {n && <p className={cn("mb-1 text-sm", k === todayKey ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-crimson-600 font-semibold text-white" : "text-muted")}>{n}</p>}
                {list.map((e) => (
                  <Link key={e.id} href={`/agenda/${e.slug}`} className="mb-1 block border-l-2 border-gold-500 bg-navy-50 px-2 py-1 text-xs leading-snug text-navy-900 hover:bg-navy-100">
                    <span className="font-semibold">{formatDate(e.startsAt, locale, { hour: "2-digit", minute: "2-digit" })}</span> {l(e.title)}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
        {/* Mobile : liste du mois */}
        <div className="md:hidden">
          {events.length ? events.map((e) => <EventRow key={e.id} e={e} locale={locale} t={t} />) : <p className="text-muted">{t.agenda.noEventsMonth}</p>}
        </div>
        {events.length === 0 && <p className="mt-6 hidden text-muted md:block">{t.agenda.noEventsMonth}</p>}
      </div>
    );
  }
}
