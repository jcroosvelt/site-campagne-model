import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/i18n-shared-server";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, ButtonLink, Table, td } from "@/components/admin/ui";

export const metadata = { title: "Agenda" };
const TYPES = { MEETING: "Meeting", CONFERENCE: "Conférence", TRAVEL: "Déplacement", RALLY: "Rassemblement", OTHER: "Autre" };

export default async function AgendaAdmin() {
  await requireUser("events.manage");
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" }, include: { _count: { select: { registrations: true } } }, take: 300 });
  return (
    <>
      <AdminHeader title="Agenda" actions={<ButtonLink href="/admin/agenda/nouveau">Nouvel événement</ButtonLink>} />
      <Table head={["Date", "Événement", "Type", "Lieu", "Inscrits", "Statut"]} empty={events.length === 0}>
        {events.map((e) => (
          <tr key={e.id} className={e.startsAt < new Date() ? "text-slate-500" : ""}>
            <td className={`${td} whitespace-nowrap`}>{formatDate(e.startsAt, "fr", { dateStyle: "medium", timeStyle: "short" })}</td>
            <td className={td}><Link href={`/admin/agenda/${e.id}`} className="font-medium text-navy-900 hover:underline">{localize(e.title, "fr")}</Link></td>
            <td className={td}>{TYPES[e.type]}</td>
            <td className={td}>{e.city}</td>
            <td className={td}>{e.registrationEnabled ? `${e._count.registrations}${e.capacity ? ` / ${e.capacity}` : ""}` : "—"}</td>
            <td className={td}><Badge tone={e.published ? "PUBLISHED" : "DRAFT"}>{e.published ? "Publié" : "Masqué"}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
