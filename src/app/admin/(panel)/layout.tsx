import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Permission } from "@/lib/permissions";
import { logoutAction } from "../actions";
import { AdminNavLink } from "@/components/admin/AdminNavLink";

const NAV: { href: string; label: string; perm: Permission }[] = [
  { href: "/admin", label: "Tableau de bord", perm: "dashboard.view" },
  { href: "/admin/contenus", label: "Contenus du site", perm: "content.manage" },
  { href: "/admin/programme", label: "Programme", perm: "content.manage" },
  { href: "/admin/actualites", label: "Actualités", perm: "news.manage" },
  { href: "/admin/agenda", label: "Agenda", perm: "events.manage" },
  { href: "/admin/galerie", label: "Galerie", perm: "gallery.manage" },
  { href: "/admin/medias", label: "Médiathèque", perm: "media.upload" },
  { href: "/admin/messages", label: "Messages & inscrits", perm: "inbox.view" },
  { href: "/admin/dons", label: "Dons", perm: "donations.stats" },
  { href: "/admin/rapports", label: "Rapports financiers", perm: "reports.manage" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", perm: "users.manage" },
  { href: "/admin/journal", label: "Journal d'audit", perm: "audit.view" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = NAV.filter((n) => can(user.role, n.perm));
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col bg-navy-950 text-white/80 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="font-serif text-lg font-semibold text-white">Administration</Link>
          <Link href="/" target="_blank" className="text-white/50 hover:text-white" aria-label="Voir le site"> </Link>
        </div>
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          {items.map((n) => (
            <AdminNavLink key={n.href} href={n.href} exact={n.href === "/admin"}><span className="whitespace-nowrap">{n.label}</span>
            </AdminNavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <Link href="/admin/compte" className="block text-sm font-medium text-white hover:underline">{user.name}</Link>
          <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
          <form action={logoutAction} className="mt-3">
            <button className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"> Se déconnecter</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          <Link href="/admin/compte" className="text-sm font-medium">{user.name}</Link>
          <form action={logoutAction}><button className="inline-flex items-center gap-1 text-sm text-slate-600"> Déconnexion</button></form>
        </div>
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
