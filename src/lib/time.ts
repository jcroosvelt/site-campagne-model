export const TZ = "America/Port-au-Prince";

function tzOffsetMinutes(ts: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - ts) / 60000);
}

/** "YYYY-MM-DDTHH:mm" (heure d'Haïti) → Date UTC. */
export function haitiLocalToDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const guess = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  const first = guess - tzOffsetMinutes(guess) * 60000;
  return new Date(guess - tzOffsetMinutes(first) * 60000);
}

/** Date → "YYYY-MM-DDTHH:mm" (heure d'Haïti), pour les champs datetime-local. */
export function dateToHaitiLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const local = new Date(d.getTime() + tzOffsetMinutes(d.getTime()) * 60000);
  return local.toISOString().slice(0, 16);
}
