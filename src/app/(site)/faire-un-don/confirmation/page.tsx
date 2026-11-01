import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleX, Clock, Download, Landmark, RotateCcw } from "lucide-react";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { syncWithProvider, transitionDonation } from "@/lib/donations";
import { formatDate, formatMoney } from "@/lib/utils";
import { AutoRefresh } from "@/components/site/AutoRefresh";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ ref?: string; token?: string; annule?: string }> };

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { t, l, locale } = await getDictionary();
  const { ref, token, annule } = await searchParams;
  if (!ref || !token) notFound();
  let d = await prisma.donation.findUnique({ where: { reference: ref } });
  if (!d || !safeEqual(d.accessToken, token)) notFound();

  // Le statut affiché provient TOUJOURS de la base, mise à jour par webhook signé ou vérification serveur.
  d = await syncWithProvider(d);
  if (annule === "1" && d.status === "PENDING" && d.method === "CARD") {
    // Abandon explicite sur la page du prestataire : la session ne peut plus aboutir.
    await transitionDonation(d.id, "CANCELLED", { failureReason: "Paiement abandonné par le donateur" });
    d = (await prisma.donation.findUnique({ where: { id: d.id } }))!;
  }
  const cfg = await getSetting("donations");

  const meta = {
    PENDING: { Icon: Clock, color: "text-gold-600", text: t.confirmation.pendingText },
    CONFIRMED: { Icon: CircleCheck, color: "text-emerald-700", text: t.confirmation.confirmedText },
    FAILED: { Icon: CircleX, color: "text-crimson-600", text: t.confirmation.failedText },
    CANCELLED: { Icon: CircleX, color: "text-muted", text: t.confirmation.cancelledText },
    REFUNDED: { Icon: RotateCcw, color: "text-muted", text: t.confirmation.refundedText },
  }[d.status];
  const bankPending = d.method === "BANK_TRANSFER" && d.status === "PENDING";

  return (
    <>
      <header className="bg-navy-900 pt-32 pb-36 text-white md:pt-40">
        <div className="container-site max-w-3xl">
          <p className="kicker kicker-light mb-5">{t.nav.donate}</p>
          <h1 className="display text-white">{t.confirmation.title}</h1>
        </div>
      </header>
      <section className="-mt-24 pb-24">
        <div className="container-site max-w-3xl">
          <div className="bg-white p-8 shadow-[0_30px_80px_-30px_rgba(11,31,58,0.35)] ring-1 ring-line md:p-12">
            <div className="flex items-start gap-4">
              <meta.Icon className={`h-8 w-8 shrink-0 ${meta.color}`} strokeWidth={1.5} aria-hidden />
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${meta.color}`}>{t.confirmation.statuses[d.status]}</p>
                <p className="mt-2 leading-relaxed text-ink" role="status">{bankPending ? t.confirmation.bankText : meta.text}</p>
              </div>
            </div>
            <dl className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
              {[
                [t.confirmation.reference, <span key="r" className="font-mono text-base tracking-wider">{d.reference}</span>],
                [t.confirmation.amount, formatMoney(d.amountCents, d.currency, locale)],
                [t.confirmation.method, t.donate.methods[d.method]],
                [t.confirmation.date, formatDate(d.createdAt, locale, { dateStyle: "long", timeStyle: "short" })],
              ].map(([k, v], i) => (
                <div key={i} className="bg-white p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{k}</dt>
                  <dd className="mt-1.5 font-serif text-xl font-semibold text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            {bankPending && (
              <div className="mt-8 border-l-2 border-gold-500 bg-ivory p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Landmark className="h-5 w-5 text-gold-600" aria-hidden /> {t.confirmation.bankTitle}</h2>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
                  <dt className="text-muted">Banque</dt><dd className="font-medium">{cfg.bankName}</dd>
                  <dt className="text-muted">Titulaire</dt><dd className="font-medium">{cfg.bankAccountName}</dd>
                  <dt className="text-muted">Compte</dt><dd className="font-mono font-medium">{cfg.bankAccountNumber}</dd>
                  {cfg.bankSwift && (<><dt className="text-muted">SWIFT / BIC</dt><dd className="font-mono font-medium">{cfg.bankSwift}</dd></>)}
                  <dt className="text-muted">{t.confirmation.reference}</dt><dd className="font-mono font-semibold text-crimson-600">{d.reference}</dd>
                </dl>
                {l(cfg.bankInstructions) && <p className="mt-4 text-sm text-muted">{l(cfg.bankInstructions)}</p>}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {d.status === "CONFIRMED" && d.receiptNumber && (
                <a href={`/api/donations/receipt?ref=${encodeURIComponent(d.reference)}&token=${encodeURIComponent(token)}`} className="btn btn-primary">
                  <Download className="h-4 w-4" aria-hidden /> {t.confirmation.downloadReceipt}
                </a>
              )}
              {d.status === "PENDING" && !bankPending && <AutoRefresh label={t.confirmation.refresh} />}
              {(d.status === "FAILED" || d.status === "CANCELLED") && <Link href="/faire-un-don" className="btn btn-donate">{t.confirmation.retry}</Link>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
