"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function ActionForm({
  action,
  children,
  submitLabel,
  confirmText,
  tone = "primary",
  className,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submitLabel: string;
  confirmText?: string;
  tone?: "primary" | "danger" | "secondary";
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as FormState);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmText && !confirm(confirmText)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={cn("space-y-3", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60",
            tone === "primary" && "bg-navy-900 text-white hover:bg-navy-700",
            tone === "danger" && "border border-red-300 bg-white text-red-700 hover:bg-red-50",
            tone === "secondary" && "border border-slate-300 bg-white text-slate-800 hover:border-slate-400",
          )}
        >
           {submitLabel}
        </button>
        {state.message && <p role="status" className={cn("text-sm", state.ok ? "text-emerald-700" : "text-red-700")}>{state.message}</p>}
      </div>
    </form>
  );
}
