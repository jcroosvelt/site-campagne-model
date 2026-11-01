import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { changePasswordAction } from "../../actions";

export const metadata = { title: "Mon compte" };

export default async function Account() {
  const user = await requireUser();
  return (
    <>
      <AdminHeader title="Mon compte" description={`${user.email} · ${ROLE_LABELS[user.role]}`} />
      <Card title="Changer de mot de passe" className="max-w-xl">
        <ActionForm action={changePasswordAction} submitLabel="Mettre à jour">
          <label className="block text-sm font-medium">Mot de passe actuel<input name="current" type="password" autoComplete="current-password" required className="input mt-1" /></label>
          <label className="block text-sm font-medium">Nouveau mot de passe<input name="next" type="password" autoComplete="new-password" required minLength={12} className="input mt-1" /></label>
          <label className="block text-sm font-medium">Confirmation<input name="confirm" type="password" autoComplete="new-password" required minLength={12} className="input mt-1" /></label>
        </ActionForm>
      </Card>
    </>
  );
}
