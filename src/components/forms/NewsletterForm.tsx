"use client";

import { subscribeNewsletter } from "@/app/actions/public";
import { FormMessage, SpamGuard, SubmitButton, useNoResetForm } from "./fields";
import type { Dictionary } from "@/lib/i18n";

export function NewsletterForm({ t, ts }: { t: Dictionary; ts: string }) {
  const { state, pending, onSubmit } = useNoResetForm(subscribeNewsletter);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form onSubmit={onSubmit} className="relative space-y-4" noValidate>
      <SpamGuard ts={ts} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">{t.newsletter.email}</label>
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder={t.newsletter.email} className="input flex-1" aria-invalid={state.errors?.email ? true : undefined} />
        <SubmitButton pending={pending} pendingLabel={t.common.sending}>{t.newsletter.subscribe}</SubmitButton>
      </div>
      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="checkbox" />
        <span>{t.newsletter.consent}</span>
      </label>
      <FormMessage state={state} />
    </form>
  );
}
