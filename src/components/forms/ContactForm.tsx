"use client";

import Link from "next/link";
import { submitContact } from "@/app/actions/public";
import { Check, Field, FormMessage, SpamGuard, SubmitButton, TextArea, useNoResetForm } from "./fields";
import type { Dictionary } from "@/lib/i18n";

export function ContactForm({ t, ts }: { t: Dictionary; ts: string }) {
  const { state, pending, onSubmit } = useNoResetForm(submitContact);
  const e = state.errors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <SpamGuard ts={ts} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label={t.contact.name} required autoComplete="name" error={e.name} />
        <Field name="email" type="email" label={t.contact.email} required autoComplete="email" error={e.email} />
        <Field name="phone" type="tel" label={`${t.contact.phone} (${t.common.optional})`} autoComplete="tel" error={e.phone} />
        <Field name="subject" label={t.contact.subject} required error={e.subject} />
      </div>
      <TextArea name="message" label={t.contact.message} required rows={6} error={e.message} maxLength={5000} />
      <Check name="consent" required error={e.consent} label={<>{t.contact.consent} <Link href="/confidentialite" className="underline">↗</Link></>} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel={t.common.sending}>{t.common.send}</SubmitButton>
    </form>
  );
}
