import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { AdminHeader, Badge, Table, td } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { setInboxStatusAction } from "../../actions";

export const metadata = { title: "Messages & inscrits" };
const STATUS = { NEW: "Nouveau", IN_PROGRESS: "En cours", DONE: "Traité", ARCHIVED: "Archivé" } as const;
const TABS = [
  { id: "contact", label: "Messages" },
  { id: "benevoles", label: "Bénévoles" },
  { id: "newsletter", label: "Newsletter" },
];

function StatusSelect({ kind, id, status }: { kind: string; id: string; status: keyof typeof STATUS }) {
  return (
    <form action={setInboxStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="rounded border border-slate-300 px-2 py-1 text-xs" aria-label="Statut">
        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">OK</button>
    </form>
  );
}

export default async function Messages({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  await requireUser("inbox.view");
  const tab = (await searchParams).onglet ?? "contact";
  return (
    <>
      <AdminHeader title="Messages & inscrits" description="Données personnelles : à traiter uniquement pour la finalité déclarée, puis archiver ou supprimer." />
      <nav className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/messages?onglet=${t.id}`} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium", tab === t.id ? "border-navy-900 text-navy-900" : "border-transparent text-slate-500 hover:text-slate-800")}>{t.label}</Link>
        ))}
      </nav>
      {tab === "contact" && <ContactList />}
      {tab === "benevoles" && <VolunteerList />}
      {tab === "newsletter" && <SubscriberList />}
    </>
  );
}

async function ContactList() {
  const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-sm text-slate-500">Aucun message.</p>}
      {rows.map((m) => (
        <article key={m.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{m.subject} <Badge tone={m.status}>{STATUS[m.status]}</Badge></p>
              <p className="text-sm text-slate-500"><a className="underline" href={`mailto:${m.email}`}>{m.name} &lt;{m.email}&gt;</a>{m.phone ? ` · ${m.phone}` : ""} · {formatDate(m.createdAt, "fr", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <div className="flex items-center gap-2"><StatusSelect kind="contact" id={m.id} status={m.status} /><DeleteButton kind="contact" id={m.id} /></div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{m.message}</p>
        </article>
      ))}
    </div>
  );
}

async function VolunteerList() {
  const rows = await prisma.volunteer.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return (
    <Table head={["Nom", "Contact", "Commune", "Domaines", "Statut", ""]} empty={rows.length === 0}>
      {rows.map((v) => (
        <tr key={v.id}>
          <td className={td}><p className="font-medium">{v.firstName} {v.lastName}</p><p className="text-xs text-slate-500">{formatDate(v.createdAt, "fr", { dateStyle: "short" })}</p></td>
          <td className={td}><a href={`mailto:${v.email}`} className="underline">{v.email}</a><p className="text-xs">{v.phone}</p></td>
          <td className={td}>{v.city}</td>
          <td className={td}><p className="text-xs">{v.interests.join(", ") || "—"}</p>{v.availability && <p className="text-xs text-slate-500">{v.availability}</p>}{v.message && <p className="mt-1 max-w-xs text-xs text-slate-600">{v.message}</p>}</td>
          <td className={td}><StatusSelect kind="volunteer" id={v.id} status={v.status} /></td>
          <td className={td}><DeleteButton kind="volunteer" id={v.id} /></td>
        </tr>
      ))}
    </Table>
  );
}

async function SubscriberList() {
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  const label = { PENDING: "En attente de confirmation", CONFIRMED: "Confirmé", UNSUBSCRIBED: "Désinscrit" };
  return (
    <>
    <p className="mb-4"><a href="/api/admin/newsletter/export" className="text-sm font-medium text-navy-700 underline">Exporter les abonnés confirmés (CSV)</a></p>
    <Table head={["E-mail", "Langue", "Statut", "Inscrit le", ""]} empty={rows.length === 0}>
      {rows.map((s) => (
        <tr key={s.id}>
          <td className={td}>{s.email}</td>
          <td className={td}>{s.locale.toUpperCase()}</td>
          <td className={td}><Badge tone={s.status === "CONFIRMED" ? "CONFIRMED" : s.status === "PENDING" ? "PENDING" : "CANCELLED"}>{label[s.status]}</Badge></td>
          <td className={td}>{formatDate(s.createdAt, "fr", { dateStyle: "short" })}</td>
          <td className={td}><DeleteButton kind="subscriber" id={s.id} /></td>
        </tr>
      ))}
    </Table>
    </>
  );
}
