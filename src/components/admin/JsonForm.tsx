"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/settings-schema";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

type Locale = "fr" | "ht" | "en";
type Values = Record<string, unknown>;
const LOCALES: { id: Locale; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "ht", label: "Kreyòl" },
  { id: "en", label: "English" },
];

function emptyFor(f: Field): unknown {
  switch (f.type) {
    case "boolean": return false;
    case "number": return 0;
    case "l10n": case "l10nText": case "l10nMarkdown": return { fr: "", ht: "", en: "" };
    case "l10nLines": return { fr: [], ht: [], en: [] };
    case "stringList": return [];
    case "list": return [];
    case "select": return f.options[0]?.value ?? "";
    default: return "";
  }
}
export function emptyItem(fields: Field[]): Values {
  return Object.fromEntries(fields.map((f) => [f.name, emptyFor(f)]));
}

/**
 * Formulaire d'administration généré à partir d'un descripteur de champs.
 * Les valeurs sont envoyées en JSON (champ "payload") et revalidées côté serveur avec le même descripteur.
 */
export function JsonForm({
  fields,
  initial,
  action,
  hidden,
  submitLabel = "Enregistrer",
}: {
  fields: Field[];
  initial: Values;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  hidden?: Record<string, string>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Values>(() => ({ ...emptyItem(fields), ...initial }));
  const [locale, setLocale] = useState<Locale>("fr");
  const [state, formAction, pending] = useActionState(action, { ok: false } as FormState);
  const hasL10n = JSON.stringify(fields).includes('"type":"l10n');

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(values)} />
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {hasL10n && (
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-3 bg-slate-50/95 px-1 py-3 backdrop-blur">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Langue d&apos;édition</span>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            {LOCALES.map((l) => (
              <button key={l.id} type="button" onClick={() => setLocale(l.id)} className={cn("rounded px-3 py-1.5 text-sm font-medium", locale === l.id ? "bg-navy-900 text-white" : "text-slate-600 hover:text-slate-900")}>
                {l.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">Le français est utilisé si une traduction manque.</span>
        </div>
      )}
      <FieldList fields={fields} values={values} onChange={setValues} locale={locale} errors={state.errors} />
      <div className="sticky bottom-0 -mx-1 flex items-center gap-4 border-t border-slate-200 bg-white/95 px-1 py-4 backdrop-blur">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} {submitLabel}
        </button>
        {state.message && <p role="status" className={cn("text-sm", state.ok ? "text-emerald-700" : "text-crimson-600")}>{state.message}</p>}
      </div>
    </form>
  );
}

function FieldList({ fields, values, onChange, locale, errors, prefix = "" }: { fields: Field[]; values: Values; onChange: (v: Values) => void; locale: Locale; errors?: Record<string, string>; prefix?: string }) {
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => onChange({ ...values, [f.name]: v })} locale={locale} error={errors?.[prefix + f.name]} />
      ))}
    </div>
  );
}

const inputCls = "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/15";

function FieldInput({ field: f, value, onChange, locale, error }: { field: Field; value: unknown; onChange: (v: unknown) => void; locale: Locale; error?: string }) {
  const id = useRef(`fld-${Math.random().toString(36).slice(2)}`).current;
  const label = (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
      {f.label}
      {(f.type === "l10n" || f.type === "l10nText" || f.type === "l10nMarkdown" || f.type === "l10nLines") && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-500">{locale}</span>}
    </label>
  );
  const help = f.help ? <p className="mt-1 text-xs text-slate-500">{f.help}</p> : null;
  const err = error ? <p className="mt-1 text-xs text-crimson-600">{error}</p> : null;

  switch (f.type) {
    case "boolean":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-navy-900" />
          <span className="text-sm text-slate-800">{f.label}{help}</span>
        </label>
      );
    case "select":
      return (
        <div>{label}<select id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{help}{err}</div>
      );
    case "number":
      return <div>{label}<input id={id} type="number" className={inputCls} value={Number(value ?? 0)} min={f.min} max={f.max} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />{help}{err}</div>;
    case "textarea":
      return <div>{label}<textarea id={id} rows={4} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />{help}{err}</div>;
    case "datetime":
      return <div>{label}<input id={id} type="datetime-local" className={cn(inputCls, "max-w-xs")} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />{help ?? <p className="mt-1 text-xs text-slate-500">Heure d&apos;Haïti.</p>}{err}</div>;
    case "image":
      return <div>{label}<ImageInput id={id} value={String(value ?? "")} onChange={onChange} />{help}{err}</div>;
    case "file":
      return <div>{label}<ImageInput id={id} value={String(value ?? "")} onChange={onChange} accept="application/pdf" />{help}{err}</div>;
    case "l10n":
    case "l10nText":
    case "l10nMarkdown": {
      const v = (value ?? { fr: "", ht: "", en: "" }) as Record<Locale, string>;
      const set = (s: string) => onChange({ ...v, [locale]: s });
      const missing = LOCALES.filter((l) => !v[l.id]?.trim()).map((l) => l.id.toUpperCase());
      return (
        <div>
          {label}
          {f.type === "l10n" ? (
            <input id={id} type="text" className={inputCls} value={v[locale] ?? ""} placeholder={locale !== "fr" ? v.fr : ""} onChange={(e) => set(e.target.value)} />
          ) : (
            <textarea id={id} rows={f.type === "l10nMarkdown" ? 12 : 4} className={cn(inputCls, f.type === "l10nMarkdown" && "font-mono text-[0.8rem] leading-relaxed")} value={v[locale] ?? ""} placeholder={locale !== "fr" ? v.fr : ""} onChange={(e) => set(e.target.value)} />
          )}
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
            {f.type === "l10nMarkdown" && <span>Markdown : **gras**, *italique*, ## Titre, - liste, [lien](https://…)</span>}
            {missing.length > 0 && missing.length < 3 && <span className="text-amber-700">Traduction manquante : {missing.join(", ")}</span>}
          </div>
          {help}{err}
        </div>
      );
    }
    case "l10nLines": {
      const v = (value ?? { fr: [], ht: [], en: [] }) as Record<Locale, string[]>;
      return (
        <div>
          {label}
          <textarea id={id} rows={6} className={inputCls} value={(v[locale] ?? []).join("\n")} onChange={(e) => onChange({ ...v, [locale]: e.target.value.split("\n") })} />
          <p className="mt-1 text-xs text-slate-500">Une entrée par ligne.</p>
          {err}
        </div>
      );
    }
    case "stringList": {
      const arr = (value as string[]) ?? [];
      return (
        <div>{label}<textarea id={id} rows={5} className={inputCls} value={arr.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} /><p className="mt-1 text-xs text-slate-500">Une valeur par ligne.</p>{help}{err}</div>
      );
    }
    case "list": {
      const items = (value as Values[]) ?? [];
      const update = (i: number, v: Values) => onChange(items.map((it, j) => (j === i ? v : it)));
      const move = (i: number, d: number) => {
        const next = [...items];
        const [x] = next.splice(i, 1);
        next.splice(i + d, 0, x!);
        onChange(next);
      };
      return (
        <fieldset className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">{f.label}</legend>
          {help}
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{f.itemLabel ?? "Élément"} {i + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Monter"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Descendre"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded p-1.5 text-crimson-600 hover:bg-crimson-50" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <FieldList fields={f.fields} values={{ ...emptyItem(f.fields), ...it }} onChange={(v) => update(i, v)} locale={locale} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onChange([...items, emptyItem(f.fields)])} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-navy-700 hover:text-navy-900">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
          {err}
        </fieldset>
      );
    }
    default:
      return <div>{label}<input id={id} type={f.type === "email" ? "email" : "text"} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />{help}{err}</div>;
  }
}

export function ImageInput({ id, value, onChange, accept = "image/jpeg,image/png,image/webp,image/avif" }: { id?: string; value: string; onChange: (v: string) => void; accept?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi");
      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-start gap-4">
      {value && !value.endsWith(".pdf") ? (
        <img src={value} alt="" className="h-20 w-28 shrink-0 rounded border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">{value ? "PDF" : "Aucun"}</div>
      )}
      <div className="flex-1 space-y-2">
        <input id={id} className={inputCls} value={value} placeholder="/uploads/… ou https://…" onChange={(e) => onChange(e.target.value)} />
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-navy-700">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />} Téléverser
            <input type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {value && <button type="button" onClick={() => onChange("")} className="text-sm text-slate-500 hover:text-crimson-600">Retirer</button>}
          {error && <span className="text-xs text-crimson-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
