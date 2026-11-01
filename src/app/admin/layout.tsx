import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Administration", template: "%s — Administration" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-slate-900">{children}</div>;
}
