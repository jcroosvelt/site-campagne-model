import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";
import { SECTIONS, type SectionKey } from "@/lib/settings-schema";
import { getSetting } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { saveSettingsAction } from "../../../actions";

const EDITABLE = ["site", "home", "candidate", "contact", "navigation", "seo", "legal"];

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!EDITABLE.includes(section)) notFound();
  const def = SECTIONS[section as SectionKey];
  await requireUser(def.permission as Permission);
  const value = await getSetting(section as SectionKey);
  return (
    <>
      <AdminHeader title={def.title} back={{ href: "/admin/contenus", label: "Contenus" }} description="Les champs laissés vides ne sont pas affichés sur le site." />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={def.fields} initial={value as Record<string, unknown>} action={saveSettingsAction} hidden={{ section }} />
      </div>
    </>
  );
}
