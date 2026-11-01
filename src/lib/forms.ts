import { z } from "zod";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };
export const initialFormState: FormState = { ok: false };

/** Convertit les erreurs zod en dictionnaire champ → message. */
export function fieldErrors(err: z.ZodError, messages?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = messages?.[key] ?? issue.message;
  }
  return out;
}

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const phoneSchema = optionalText(30).refine((v) => !v || /^[+()\d\s.-]{6,30}$/.test(v), "Numéro de téléphone invalide");
