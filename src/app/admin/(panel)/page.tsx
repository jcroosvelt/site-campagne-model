import Link from "next/link";
import { TriangleAlert, CircleCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { confirmedDonationStats } from "@/lib/donations";
import { getSetting } from "@/lib/settings";
import { methodStatuses } from "@/lib/payments";
import { isMailConfigured } from "@/lib/mail";
import { publishedArticleWhere } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/utils";
import { AdminHeader, Card, Stat } from "@/components/admin/ui";
import { METHOD_LABELS_FR } from "@/lib/donation-status";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const user = await requireUser("dashboard.view");
  const { refus } = await searchParams;
  const since30 = new Date(Date.now() - 30 * 86400000);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const [visitorsToday, visitors30, articles, scheduled, eventsUpcoming, eventsTotal, registrations, volunteers, subscribers, messagesNew, site] = await Promise.all([
    prisma.visitorDay.count({ where: { day: today } }),
    prisma.visitorDay.count({ where: { day: { gte: since30 } } }),
    prisma.article.count({ where: publishedArticleWhere() }),
    prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { gt: new Date() } } }),
    prisma.event.count({ where: { published: true, startsAt: { gte: new Date() } } }),
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.volunteer.count(),
    prisma.newsletterSubscriber.count({ where: { status: "CONFIRMED" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    getSetting("site"),
  ]);
  const showFinance = can(user.role, "donations.stats");
  const [stats, stats30, cfg, compliance, byMethod] = showFinance
    ? await Promise.all([
        confirmedDonationStats(),
        confirmedDonationStats({ confirmedAt: { gte: since30 } }),
        getSetting("donations"),
        getSetting("compliance"),
        prisma.donation.groupBy({ by: ["method"], where: { status: "CONFIRMED" }, _sum: { amountCents: true }, _count: true }),
      ])
    : [null, null, null, null, []];
  const statuses = cfg && compliance ? methodStatuses(cfg, compliance) : [];
  const alerts: string[] = [];
  if (!isMailConfigured()) alerts.push("SMTP non configuré : les e-mails (reçus, confirmations) sont uniquement journalisés.");
  if (site.candidateName === "Prénom NOM" || site.legalEntity.includes("[À COMPLÉTER]")) alerts.push("Des contenus provisoires [À COMPLÉTER] sont encore présents (identité de la campagne).");

  return (
    <>
      <AdminHeader title={`Bonjour, ${user.name.split(" ")[0]}`} description={`Vue d'ensemble au ${formatDate(new Date(), "fr", { dateStyle: "full" })}.`} />
      {refus && <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Accès refusé : votre rôle ne permet pas d&apos;ouvrir cette page.</p>}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {alerts.map((a) => <p key={a} className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {a}</p>)}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visiteurs uniques — aujourd'hui" value={visitorsToday} hint={`${visitors30} visites uniques/jour cumulées sur 30 jours`} />
        <Stat label="Actualités publiées" value={articles} hint={scheduled ? `${scheduled} programmée(s)` : undefined} />
        <Stat label="Événements" value={eventsTotal} hint={`${eventsUpcoming} à venir`} />
        <Stat label="Inscriptions" value={registrations + volunteers + subscribers} hint={`${registrations} événements · ${volunteers} bénévoles · ${subscribers} newsletter`} />
      </div>

      {showFinance && stats && stats30 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Contributions confirmées" value={stats.count} hint="Uniquement les paiements confirmés" />
          <Stat label="Montant total confirmé" value={formatMoney(stats.totalCents)} hint={`Moyenne : ${formatMoney(stats.averageCents)}`} />
          <Stat label="Confirmé sur 30 jours" value={formatMoney(stats30.totalCents)} hint={`${stats30.count} contribution(s)`} />
          <Stat label="Messages non traités" value={messagesNew} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {showFinance && (
          <Card title="Moyens de paiement">
            <ul className="divide-y divide-slate-100">
              {statuses.map((s) => (
                <li key={s.method} className="py-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {s.available ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : <TriangleAlert className="h-4 w-4 text-amber-600" />}
                    {METHOD_LABELS_FR[s.method]} — {s.available ? "actif" : "inactif"}
                  </p>
                  {!s.available && <p className="mt-1 pl-6 text-xs text-slate-500">{s.blockers.join(" · ")}</p>}
                  {(() => {
                    const m = byMethod.find((b) => b.method === s.method);
                    return m ? <p className="mt-1 pl-6 text-xs text-slate-500">{m._count} confirmé(s) · {formatMoney(m._sum.amountCents ?? 0)}</p> : null;
                  })()}
                </li>
              ))}
            </ul>
            <Link href="/admin/dons/parametres" className="mt-3 inline-block text-sm font-medium text-navy-700 underline">Paramètres et conformité →</Link>
          </Card>
        )}
        <Card title="Raccourcis">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {can(user.role, "news.manage") && <li><Link className="text-navy-700 underline" href="/admin/actualites/nouveau">Rédiger une actualité</Link></li>}
            {can(user.role, "events.manage") && <li><Link className="text-navy-700 underline" href="/admin/agenda/nouveau">Ajouter un événement</Link></li>}
            {can(user.role, "gallery.manage") && <li><Link className="text-navy-700 underline" href="/admin/galerie/nouveau">Ajouter à la galerie</Link></li>}
            {can(user.role, "content.manage") && <li><Link className="text-navy-700 underline" href="/admin/contenus/home">Textes de la page d&apos;accueil</Link></li>}
            {can(user.role, "inbox.view") && <li><Link className="text-navy-700 underline" href="/admin/messages">Messages reçus</Link></li>}
            {can(user.role, "donations.view") && <li><Link className="text-navy-700 underline" href="/admin/dons">Contributions</Link></li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
