"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { initialFormState, type FormState } from "@/lib/forms";

/**
 * Soumission sans réinitialisation automatique (React 19 vide les formulaires après une action) :
 * en cas d'erreur de validation, les valeurs saisies sont conservées.
 */
export function useNoResetForm(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
  return { state, pending, onSubmit };
}

export function Field({
  name,
  label,
  error,
  required,
  hint,
  className,
  ...props
}: { name: string; label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-crimson-600" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="input"
        {...props}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function TextArea({
  name,
  label,
  error,
  required,
  className,
  ...props
}: { name: string; label: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-crimson-600" aria-hidden>*</span>}
      </label>
      <textarea id={id} name={name} required={required} aria-invalid={error ? true : undefined} className="input min-h-36" {...props} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Check({ name, label, error, required, ...props }: { name: string; label: React.ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input type="checkbox" name={name} required={required} aria-invalid={error ? true : undefined} className="checkbox" {...props} />
        <span>{label}</span>
      </label>
      {error && <p className="field-error ml-7">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel, className, pending: pendingProp }: { children: React.ReactNode; pendingLabel: string; className?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={cn("btn", className ?? "btn-primary")} aria-live="polite">
      {pending ? (
        <> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 border-l-2 px-4 py-3 text-sm",
        state.ok ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-crimson-600 bg-crimson-50 text-crimson-700",
      )}
    >
      
      <span>{state.message}</span>
    </div>
  );
}

/** Champs anti-spam invisibles (pot de miel + horodatage signé fourni par le serveur). */
export function SpamGuard({ ts }: { ts: string }) {
  return (
    <>
      <input type="hidden" name="_ts" value={ts} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site web
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  );
}
