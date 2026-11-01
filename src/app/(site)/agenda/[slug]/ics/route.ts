import { getEvent } from "@/lib/queries";
import { localize } from "@/lib/i18n-shared-server";
import { env } from "@/lib/env";

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) return new Response("Introuvable", { status: 404 });
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 2 * 3600 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campagne//Agenda//FR",
    "BEGIN:VEVENT",
    `UID:${e.id}@${new URL(env.appUrl()).host}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(e.startsAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(localize(e.title, "fr"))}`,
    `LOCATION:${esc([e.venue, e.address, e.city].filter(Boolean).join(", "))}`,
    `URL:${env.appUrl()}/agenda/${e.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}.ics"` } });
}
