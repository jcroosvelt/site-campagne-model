import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && <Link href={back.href} className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-900">Retour : {back.label}</Link>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy-900">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-navy-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold", variant === "primary" ? "bg-navy-900 text-white hover:bg-navy-700" : "border border-slate-300 bg-white text-slate-800 hover:border-slate-400")}>
      {children}
    </Link>
  );
}

const BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-red-50 text-red-800 ring-red-200",
  REFUNDED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  SCHEDULED: "bg-sky-50 text-sky-800 ring-sky-200",
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-500 ring-slate-200",
  NEW: "bg-sky-50 text-sky-800 ring-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-200",
  DONE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CONFIRMED_SUB: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", BADGE[tone] ?? BADGE.DRAFT)}>{children}</span>;
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-10 text-center text-sm text-slate-500">Aucun élément.</p>}
    </div>
  );
}

export const td = "px-4 py-3 align-top";
