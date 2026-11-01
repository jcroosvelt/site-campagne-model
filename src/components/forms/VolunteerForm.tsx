"use client";

import { submitVolunteer } from "@/app/actions/public";
import { Check, Field, FormMessage, SpamGuard, SubmitButton, TextArea, useNoResetForm } from "./fields";
import type { Dictionary } from "@/lib/i18n";

export function VolunteerForm({ t, ts }: { t: Dictionary; ts: string }) {
  const { state, pending, onSubmit } = useNoResetForm(submitVolunteer);
  const e = state.errors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <SpamGuard ts={ts} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="firstName" label={t.volunteer.firstName} required autoComplete="given-name" error={e.firstName} />
        <Field name="lastName" label={t.volunteer.lastName} required autoComplete="family-name" error={e.lastName} />
        <Field name="email" type="email" label={t.contact.email} required autoComplete="email" error={e.email} />
        <Field name="phone" type="tel" label={`${t.contact.phone} (${t.common.optional})`} autoComplete="tel" error={e.phone} />
        <Field name="city" label={t.volunteer.city} required className="sm:col-span-2" error={e.city} />
      </div>
      <fieldset>
        <legend className="label">{t.volunteer.interests}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(t.volunteer.interestOptions).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 border border-line px-4 py-3 text-sm transition-colors has-[:checked]:border-navy-900 has-[:checked]:bg-navy-50">
              <input type="checkbox" name="interests" value={value} className="checkbox mt-0" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field name="availability" label={`${t.volunteer.availability} (${t.common.optional})`} error={e.availability} />
      <TextArea name="message" label={`${t.volunteer.message} (${t.common.optional})`} rows={4} maxLength={2000} />
      <Check name="consent" required error={e.consent} label={t.volunteer.consent} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel={t.common.sending}>{t.volunteer.submit}</SubmitButton>
    </form>
  );
}
