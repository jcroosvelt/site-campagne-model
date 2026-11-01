"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { submitDonation } from "@/app/actions/public";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
import { Check, Field, FormMessage, SpamGuard, SubmitButton, useNoResetForm } from "./fields";

type Method = "CARD" | "MONCASH" | "BANK_TRANSFER";
const METHOD_ICONS = { CARD: CreditCard, MONCASH: Smartphone, BANK_TRANSFER: Landmark };

export function DonationForm({
  t,
  ts,
  amounts,
  min,
  max,
  methods,
  countries,
  attestations,
}: {
  t: Dictionary;
  ts: string;
  amounts: number[];
  min: number;
  max: number;
  methods: Method[];
  countries: { code: string; name: string }[];
  attestations: { id: string; text: string }[];
}) {
  const { state, pending, onSubmit } = useNoResetForm(submitDonation);
  const [amount, setAmount] = useState<string>(String(amounts[1] ?? amounts[0] ?? ""));
  const [method, setMethod] = useState<Method>(methods[0]!);
  const e = state.errors ?? {};
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  return (
    <form onSubmit={onSubmit} className="relative space-y-10" noValidate>
      <SpamGuard ts={ts} />

      <fieldset>
        <legend className="mb-4 text-2xl font-extrabold text-navy-900">1. {t.donate.chooseAmount}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {amounts.map((a) => (
            <label
              key={a}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-2xl border-2 px-4 py-4 text-center text-2xl font-black condensed transition-colors duration-200",
                amount === String(a) ? "border-flag bg-flag text-white" : "border-line text-navy-900 hover:border-flag",
              )}
            >
              <input type="radio" name="amount" value={a} checked={amount === String(a)} onChange={() => setAmount(String(a))} className="sr-only" />
              {fmt(a)} <span className="ml-1.5 text-xs font-sans font-medium opacity-70">HTG</span>
            </label>
          ))}
          <label
            className={cn(
              "col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2 transition-colors sm:col-span-3",
              amount === "custom" ? "border-flag" : "border-line",
            )}
          >
            <input type="radio" name="amount" value="custom" checked={amount === "custom"} onChange={() => setAmount("custom")} className="sr-only" />
            <span className="whitespace-nowrap text-sm font-medium text-navy-900">{t.donate.customAmount}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="customAmount"
              placeholder={t.donate.customPlaceholder}
              aria-label={t.donate.customAmount}
              onFocus={() => setAmount("custom")}
              className="w-full border-0 bg-transparent py-2 text-right text-xl font-bold focus:outline-none"
            />
            <span className="text-xs font-medium text-muted">HTG</span>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted">
          {t.donate.amountMin} : {fmt(min)} HTG · {t.donate.amountMax} : {fmt(max)} HTG
        </p>
        {e.amount && <p className="field-error">{e.amount}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-2xl font-extrabold text-navy-900">2. {t.donate.yourInfo}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="firstName" label={t.donate.firstName} required autoComplete="given-name" error={e.firstName} />
          <Field name="lastName" label={t.donate.lastName} required autoComplete="family-name" error={e.lastName} />
          <Field name="email" type="email" label={t.donate.email} required autoComplete="email" error={e.email} />
          <Field name="phone" type="tel" label={`${t.donate.phone} (${t.common.optional})`} autoComplete="tel" error={e.phone} />
          <div className="sm:col-span-2">
            <label htmlFor="f-country" className="label">
              {t.donate.country} <span className="text-crimson-600" aria-hidden>*</span>
            </label>
            <select id="f-country" name="country" required defaultValue={countries[0]?.code} className="input" aria-invalid={e.country ? true : undefined}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {e.country && <p className="field-error">{e.country}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-2xl font-extrabold text-navy-900">3. {t.donate.method}</legend>
        <div className="space-y-3">
          {methods.map((m) => {
            const Icon = METHOD_ICONS[m];
            return (
              <label
                key={m}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors",
                  method === m ? "border-flag bg-navy-50" : "border-line hover:border-flag/50",
                )}
              >
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-navy-900" />
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" strokeWidth={1.5} aria-hidden />
                <span>
                  <span className="block font-medium text-navy-900">{t.donate.methods[m]}</span>
                  <span className="mt-1 block text-sm text-muted">{t.donate.methodHints[m]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {e.method && <p className="field-error">{e.method}</p>}
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-8">
        <legend className="sr-only">{t.donate.attestationsTitle}</legend>
        <p className="text-lg font-extrabold text-navy-900">{t.donate.attestationsTitle}</p>
        {attestations.map((a) => (
          <Check key={a.id} name={`attest_${a.id}`} required label={a.text} error={e[`attest_${a.id}`]} />
        ))}
        <Check
          name="terms"
          required
          error={e.terms}
          label={
            <>
              {t.donate.terms}{" "}
              <Link href="/conditions-de-contribution" target="_blank" className="text-navy-700 underline">{t.footer.terms}</Link> ·{" "}
              <Link href="/confidentialite" target="_blank" className="text-navy-700 underline">{t.footer.privacy}</Link>
            </>
          }
        />
      </fieldset>

      <FormMessage state={state} />
      <div className="space-y-4">
        <SubmitButton pending={pending} pendingLabel={t.common.sending} className="btn-donate w-full py-4 text-base">{t.donate.submit}</SubmitButton>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden /> {t.donate.secure}
        </p>
      </div>
    </form>
  );
}
