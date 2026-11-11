"use client";

import { startTransition, useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { ok: false });
  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Adresse e-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state.message && <p role="alert" className="border-l-2 border-crimson-600 bg-crimson-50 px-3 py-2 text-sm text-crimson-700">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        Se connecter
      </button>
    </form>
  );
}
