import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveUserAction } from "../../../actions";

export default async function UserEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("users.manage");
  const { id } = await params;
  const u = id === "nouveau" ? null : await prisma.user.findUnique({ where: { id } });
  if (id !== "nouveau" && !u) notFound();
  return (
    <>
      <AdminHeader title={u ? u.name : "Nouvel utilisateur"} back={{ href: "/admin/utilisateurs", label: "Utilisateurs" }} />
      <Card className="max-w-xl">
        <ActionForm action={saveUserAction} submitLabel="Enregistrer">
          <input type="hidden" name="id" value={u?.id ?? ""} />
          <label className="block text-sm font-medium">Nom<input name="name" required defaultValue={u?.name} className="input mt-1" /></label>
          <label className="block text-sm font-medium">E-mail<input name="email" type="email" required defaultValue={u?.email} className="input mt-1" /></label>
          <label className="block text-sm font-medium">Rôle
            <select name="role" defaultValue={u?.role ?? "EDITOR"} className="input mt-1">{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">{u ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe initial"}
            <input name="password" type="password" autoComplete="new-password" required={!u} minLength={12} className="input mt-1" />
            <span className="mt-1 block text-xs font-normal text-slate-500">12 caractères minimum, avec majuscules, minuscules et chiffres. Transmettez-le par un canal sûr.</span>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={u?.active ?? true} className="h-4 w-4" /> Compte actif</label>
        </ActionForm>
      </Card>
    </>
  );
}
