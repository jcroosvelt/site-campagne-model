import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { eventFields } from "@/lib/admin-forms";
import { dateToHaitiLocal } from "@/lib/time";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Card, Table, td } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveEventAction } from "../../../actions";

export default async function EventEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("events.manage");
  const { id } = await params;
  const e = id === "nouveau" ? null : await prisma.event.findUnique({ where: { id }, include: { registrations: { orderBy: { createdAt: "desc" } } } });
  if (id !== "nouveau" && !e) notFound();
  const initial = e
    ? { ...e, startsAt: dateToHaitiLocal(e.startsAt), endsAt: dateToHaitiLocal(e.endsAt), address: e.address ?? "", image: e.image ?? "", capacity: e.capacity ?? 0 }
    : { published: true, type: "MEETING" };
  const seats = e ? e.registrations.reduce((s, r) => s + 1 + r.guests, 0) : 0;
  return (
    <>
      <AdminHeader title={e ? "Modifier l'événement" : "Nouvel événement"} back={{ href: "/admin/agenda", label: "Agenda" }} actions={e && <DeleteButton kind="event" id={e.id} confirmText="Supprimer l'événement et toutes ses inscriptions ?" />} />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={eventFields} initial={initial as Record<string, unknown>} action={saveEventAction} hidden={{ id: e?.id ?? "" }} />
      </div>
      {e && e.registrationEnabled && (
        <Card title={`Inscriptions — ${e.registrations.length} inscrit(s), ${seats} place(s)`} className="mt-8">
          <div className="mb-4"><a href={`/api/admin/events/registrations?id=${e.id}`} className="text-sm font-medium text-navy-700 underline">Exporter en CSV</a></div>
          <Table head={["Nom", "E-mail", "Téléphone", "Accomp.", "Date", ""]} empty={e.registrations.length === 0}>
            {e.registrations.map((r) => (
              <tr key={r.id}>
                <td className={td}>{r.firstName} {r.lastName}</td>
                <td className={td}>{r.email}</td>
                <td className={td}>{r.phone ?? "—"}</td>
                <td className={td}>{r.guests}</td>
                <td className={td}>{formatDate(r.createdAt, "fr", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className={td}><DeleteButton kind="registration" id={r.id} label="Retirer" /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}
