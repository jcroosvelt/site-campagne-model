"use client";

import { registerForEvent } from "@/app/actions/public";
import { Check, Field, FormMessage, SpamGuard, SubmitButton, useNoResetForm } from "./fields";
import type { Dictionary } from "@/lib/i18n";

export function EventRegistrationForm({ t, ts, eventId }: { t: Dictionary; ts: string; eventId: string }) {
  const { state, pending, onSubmit } = useNoResetForm(registerForEvent);
  const e = state.errors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form onSubmit={onSubmit} className="relative space-y-4" noValidate>
      <SpamGuard ts={ts} />
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label={t.volunteer.firstName} required autoComplete="given-name" error={e.firstName} />
        <Field name="lastName" label={t.volunteer.lastName} required autoComplete="family-name" error={e.lastName} />
      </div>
      <Field name="email" type="email" label={t.contact.email} required autoComplete="email" error={e.email} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="phone" type="tel" label={`${t.contact.phone} (${t.common.optional})`} error={e.phone} />
        <Field name="guests" type="number" min={0} max={10} defaultValue={0} label={t.agenda.guests} error={e.guests} />
      </div>
      <Check name="consent" required error={e.consent} label={t.contact.consent} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel={t.common.sending} className="btn-primary w-full">{t.agenda.register}</SubmitButton>
    </form>
  );
}
