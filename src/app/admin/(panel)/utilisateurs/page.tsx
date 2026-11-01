import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { AdminHeader, Badge, ButtonLink, Card, Table, td } from "@/components/admin/ui";

export const metadata = { title: "Utilisateurs" };

const MATRIX: [string, boolean, boolean, boolean, boolean][] = [
  ["Contenus, programme, actualités, agenda, galerie", true, true, true, false],
  ["Menu, contact, SEO, mentions légales", true, true, false, false],
  ["Messages, bénévoles, newsletter", true, true, false, false],
  ["Statistiques financières agrégées", true, true, false, true],
  ["Données personnelles des donateurs, exports", true, false, false, true],
  ["Confirmation des virements, reçus", true, false, false, true],
  ["Paramètres des dons (montants, moyens)", true, false, false, true],
  ["Validation de la conformité réglementaire", true, false, false, false],
  ["Utilisateurs et rôles", true, false, false, false],
  ["Journal d'audit", true, true, false, false],
];

export default async function Users() {
  await requireUser("users.manage");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <AdminHeader title="Utilisateurs" actions={<ButtonLink href="/admin/utilisateurs/nouveau">Nouvel utilisateur</ButtonLink>} />
      <Table head={["Nom", "E-mail", "Rôle", "Statut", "Dernière connexion"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className={td}><Link href={`/admin/utilisateurs/${u.id}`} className="font-medium text-navy-900 hover:underline">{u.name}</Link></td>
            <td className={td}>{u.email}</td>
            <td className={td}>{ROLE_LABELS[u.role]}</td>
            <td className={td}>{!u.active ? <Badge tone="CANCELLED">Désactivé</Badge> : u.lockedUntil && u.lockedUntil > new Date() ? <Badge tone="FAILED">Verrouillé</Badge> : <Badge tone="CONFIRMED">Actif</Badge>}</td>
            <td className={td}>{u.lastLoginAt ? formatDate(u.lastLoginAt, "fr", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
          </tr>
        ))}
      </Table>
      <Card title="Matrice des permissions" className="mt-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-2 pr-4">Fonction</th>{Object.values(ROLE_LABELS).map((r) => <th key={r} className="px-3 py-2">{r}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX.map(([label, ...v]) => <tr key={label}><td className="py-2 pr-4">{label}</td>{v.map((ok, i) => <td key={i} className="px-3 py-2 text-center">{ok ? "✓" : "—"}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
