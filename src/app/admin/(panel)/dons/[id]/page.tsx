import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { METHOD_LABELS_FR, STATUS_LABELS_FR } from "@/lib/donation-status";
import { formatDate, formatMoney } from "@/lib/utils";
import { AdminHeader, Badge, Card, Table, td } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { cancelDonationAction, confirmBankTransferAction, refundBankDonationAction, resendReceiptAction, saveDonationNoteAction } from "../../../actions";

export default async function DonationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("donations.view");
  const { id } = await params;
  const d = await prisma.donation.findUnique({ where: { id }, include: { paymentEvents: { orderBy: { createdAt: "asc" } } } });
  if (!d) notFound();
  await audit(user.id, "donation.view", "Donation", d.id);
  const logs = await prisma.auditLog.findMany({ where: { entity: "Donation", entityId: d.id, NOT: { action: "donation.view" } }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } });
  const manage = can(user.role, "donations.manage");
  const attestations = d.attestations as Record<string, boolean>;

  const rows: [string, React.ReactNode][] = [
    ["Montant", <strong key="a" className="font-serif text-xl">{formatMoney(d.amountCents, d.currency)}</strong>],
    ["Statut", <Badge key="s" tone={d.status}>{STATUS_LABELS_FR[d.status]}</Badge>],
    ["Moyen de paiement", `${METHOD_LABELS_FR[d.method]} (${d.provider})`],
    ["Donateur", `${d.firstName} ${d.lastName}`],
    ["E-mail", d.email],
    ["Téléphone", d.phone ?? "—"],
    ["Pays de résidence", d.country],
    ["Créé le", formatDate(d.createdAt, "fr", { dateStyle: "long", timeStyle: "medium" })],
    ["Confirmé le", d.confirmedAt ? formatDate(d.confirmedAt, "fr", { dateStyle: "long", timeStyle: "medium" }) : "—"],
    ["Réf. prestataire (session)", <span key="p" className="font-mono text-xs">{d.providerRef ?? "—"}</span>],
    ["Réf. paiement confirmé", <span key="pp" className="font-mono text-xs">{d.providerPaymentId ?? "—"}</span>],
    ["N° de reçu", d.receiptNumber ? `${d.receiptNumber}${d.receiptSentAt ? ` (envoyé le ${formatDate(d.receiptSentAt, "fr", { dateStyle: "short", timeStyle: "short" })})` : " (non envoyé)"}` : "—"],
    ["Conditions acceptées", `version ${d.termsVersion} — ${formatDate(d.termsAcceptedAt, "fr", { dateStyle: "short", timeStyle: "short" })}`],
    ["Déclarations", Object.entries(attestations).map(([k, v]) => `${k} : ${v ? "oui" : "non"}`).join(" · ") || "—"],
    ["Motif d'échec / annulation", d.failureReason ?? "—"],
  ];

  return (
    <>
      <AdminHeader title={`Contribution ${d.reference}`} back={{ href: "/admin/dons", label: "Contributions" }} actions={d.status === "CONFIRMED" && <a href={`/api/donations/receipt?ref=${d.reference}`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Télécharger le reçu</a>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <dl className="divide-y divide-slate-100">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-3">
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-sm sm:col-span-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-6">
          {manage && d.method === "BANK_TRANSFER" && d.status === "PENDING" && (
            <Card title="Rapprochement bancaire">
              <p className="mb-3 text-xs text-slate-500">Confirmez uniquement après réception effective des fonds sur le compte de campagne.</p>
              <ActionForm action={confirmBankTransferAction} submitLabel="Confirmer le virement" confirmText="Confirmer la réception de ce virement ? Un reçu officiel sera émis.">
                <input type="hidden" name="id" value={d.id} />
                <label className="block text-sm">Référence bancaire du virement<input name="bankReference" required className="input mt-1" /></label>
                <label className="block text-sm">Montant reçu (HTG)<input name="receivedAmount" required inputMode="decimal" className="input mt-1" /></label>
              </ActionForm>
            </Card>
          )}
          {manage && d.status === "PENDING" && (
            <Card title="Annuler">
              <ActionForm action={cancelDonationAction} submitLabel="Annuler la contribution" tone="danger" confirmText="Annuler cette contribution ?">
                <input type="hidden" name="id" value={d.id} />
                <label className="block text-sm">Motif<input name="reason" required className="input mt-1" /></label>
              </ActionForm>
            </Card>
          )}
          {manage && d.status === "CONFIRMED" && (
            <Card title="Reçu">
              <ActionForm action={resendReceiptAction} submitLabel="Renvoyer le reçu par e-mail" tone="secondary"><input type="hidden" name="id" value={d.id} /></ActionForm>
            </Card>
          )}
          {manage && d.status === "CONFIRMED" && d.method === "BANK_TRANSFER" && (
            <Card title="Remboursement">
              <ActionForm action={refundBankDonationAction} submitLabel="Marquer comme remboursé" tone="danger" confirmText="Confirmer que le remboursement a été effectué ?">
                <input type="hidden" name="id" value={d.id} />
                <label className="block text-sm">Référence du virement de remboursement<input name="note" required className="input mt-1" /></label>
              </ActionForm>
            </Card>
          )}
          {manage && d.status === "CONFIRMED" && d.method !== "BANK_TRANSFER" && (
            <Card title="Remboursement"><p className="text-sm text-slate-600">Effectuez le remboursement depuis le tableau de bord du prestataire. Le statut sera mis à jour automatiquement à réception de la notification signée.</p></Card>
          )}
          {manage && (
            <Card title="Notes internes">
              <ActionForm action={saveDonationNoteAction} submitLabel="Enregistrer" tone="secondary">
                <input type="hidden" name="id" value={d.id} />
                <textarea name="notes" defaultValue={d.notes ?? ""} rows={4} className="input" aria-label="Notes" />
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
      <Card title="Historique" className="mt-6">
        <Table head={["Date", "Source", "Événement"]} empty={d.paymentEvents.length + logs.length === 0}>
          {[
            ...d.paymentEvents.map((e) => ({ at: e.createdAt, src: `Prestataire (${e.provider})`, what: e.type })),
            ...logs.map((l) => ({ at: l.createdAt, src: l.user?.name ?? "Système", what: l.action })),
          ]
            .sort((a, b) => a.at.getTime() - b.at.getTime())
            .map((e, i) => (
              <tr key={i}><td className={td}>{formatDate(e.at, "fr", { dateStyle: "short", timeStyle: "medium" })}</td><td className={td}>{e.src}</td><td className={`${td} font-mono text-xs`}>{e.what}</td></tr>
            ))}
        </Table>
      </Card>
    </>
  );
}
