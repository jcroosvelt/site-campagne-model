import { CircleCheck, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { SECTIONS } from "@/lib/settings-schema";
import { getSetting } from "@/lib/settings";
import { methodStatuses } from "@/lib/payments";
import { METHOD_LABELS_FR } from "@/lib/donation-status";
import { env } from "@/lib/env";
import { AdminHeader, Card } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { saveSettingsAction } from "../../../actions";

export const metadata = { title: "Paramètres des dons" };

export default async function DonationSettings() {
  const user = await requireUser("donations.settings");
  const [cfg, compliance] = await Promise.all([getSetting("donations"), getSetting("compliance")]);
  const statuses = methodStatuses(cfg, compliance);
  const base = env.appUrl();
  return (
    <>
      <AdminHeader title="Paramètres des dons" back={{ href: "/admin/dons", label: "Contributions" }} description="Un moyen de paiement n'est proposé au public que lorsque toutes les conditions ci-dessous sont remplies." />
      <Card title="État des moyens de paiement" className="mb-6">
        <ul className="grid gap-4 md:grid-cols-3">
          {statuses.map((s) => (
            <li key={s.method} className={`rounded-md border p-4 ${s.available ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="flex items-center gap-2 font-semibold">{s.available ? <CircleCheck className="h-4 w-4 text-emerald-700" /> : <TriangleAlert className="h-4 w-4 text-amber-700" />}{METHOD_LABELS_FR[s.method]}</p>
              {s.available ? <p className="mt-1 text-sm text-emerald-800">Proposé aux donateurs.</p> : <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">{s.blockers.map((b) => <li key={b}>{b}</li>)}</ul>}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">URL à déclarer chez les prestataires</p>
          <p className="mt-1">Webhook Stripe : <code>{base}/api/webhooks/stripe</code> (événements checkout.session.*, charge.refunded)</p>
          <p>Retour MonCash : <code>{base}/api/payments/moncash/return</code></p>
          <p>Notification MonCash : <code>{base}/api/webhooks/moncash?key=MONCASH_NOTIFY_KEY</code></p>
        </div>
      </Card>

      {can(user.role, "donations.compliance") ? (
        <Card title="Conformité réglementaire (super administrateur)" className="mb-6">
          <p className="mb-4 text-sm text-slate-600">Cochez chaque point uniquement après vérification par un conseil juridique ou l&apos;autorité compétente. Chaque modification est journalisée.</p>
          <JsonForm fields={SECTIONS.compliance.fields} initial={compliance as Record<string, unknown>} action={saveSettingsAction} hidden={{ section: "compliance" }} submitLabel="Enregistrer la conformité" />
        </Card>
      ) : (
        <Card title="Conformité réglementaire" className="mb-6"><p className="text-sm text-slate-600">La validation de la conformité est réservée au super administrateur.</p></Card>
      )}

      <Card title="Configuration">
        <JsonForm fields={SECTIONS.donations.fields} initial={cfg as Record<string, unknown>} action={saveSettingsAction} hidden={{ section: "donations" }} />
      </Card>
    </>
  );
}
