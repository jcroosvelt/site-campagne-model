import type { Metadata } from "next";
import { Lock, Receipt, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { methodStatuses } from "@/lib/payments";
import { countryOptions } from "@/lib/countries";
import { signTimestamp } from "@/lib/antispam";
import { DonationForm } from "@/components/forms/DonationForm";
import { FinancialReports, UsageCategories } from "@/components/site/TransparencyBlocks";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.donate.title, description: t.donate.intro };
}

export default async function DonatePage() {
  const { t, l, locale } = await getDictionary();
  const [cfg, compliance] = await Promise.all([getSetting("donations"), getSetting("compliance")]);
  const available = methodStatuses(cfg, compliance).filter((m) => m.available).map((m) => m.method);
  const amounts = cfg.presetAmounts.map((a) => Number(String(a).replace(/\D/g, ""))).filter((n) => n > 0);

  return (
    <>
      <header className="relative overflow-hidden bg-flag text-white">
        <div className="container-site relative pt-36 pb-44 md:pt-44">
          <p className="kicker kicker-light mb-5">{t.nav.donate}</p>
          <h1 className="display max-w-4xl text-white">{t.donate.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{t.donate.intro}</p>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold-300" aria-hidden /> {t.donate.trust1}</li>
            <li className="flex items-center gap-2"><Receipt className="h-4 w-4 text-gold-300" aria-hidden /> {t.donate.trust2}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold-300" aria-hidden /> {t.donate.trust3}</li>
          </ul>
        </div>
        <div className="h-5 bg-crimson-600" aria-hidden />
      </header>

      <section className="relative z-10 -mt-28 pb-20">
        <div className="container-site">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-poster ring-1 ring-line sm:p-10 md:p-14">
            {available.length === 0 ? (
              <div className="py-6 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-gold-500" strokeWidth={1.25} aria-hidden />
                <h2 className="mt-6 text-2xl font-semibold">{t.donate.unavailableTitle}</h2>
                <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">{t.donate.unavailableText}</p>
              </div>
            ) : (
              <DonationForm
                t={t}
                ts={signTimestamp()}
                amounts={amounts}
                min={cfg.minAmount}
                max={cfg.maxAmount}
                methods={available}
                countries={countryOptions(locale, cfg.allowedCountries)}
                attestations={cfg.attestations.map((a) => ({ id: a.id, text: l(a.text) }))}
              />
            )}
          </div>
        </div>
      </section>

      <section className="bg-ivory py-20 md:py-28">
        <div className="container-site grid gap-20 lg:grid-cols-2">
          <UsageCategories />
          <FinancialReports />
        </div>
      </section>
    </>
  );
}
