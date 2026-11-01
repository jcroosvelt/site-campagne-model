import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reportFields } from "@/lib/admin-forms";
import { AdminHeader } from "@/components/admin/ui";
import { JsonForm } from "@/components/admin/JsonForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveReportAction } from "../../../actions";

export default async function ReportEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("reports.manage");
  const { id } = await params;
  const r = id === "nouveau" ? null : await prisma.financialReport.findUnique({ where: { id } });
  if (id !== "nouveau" && !r) notFound();
  return (
    <>
      <AdminHeader title={r ? "Modifier le rapport" : "Nouveau rapport"} back={{ href: "/admin/rapports", label: "Rapports" }} actions={r && <DeleteButton kind="report" id={r.id} />} />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <JsonForm fields={reportFields} initial={(r ?? { published: false }) as unknown as Record<string, unknown>} action={saveReportAction} hidden={{ id: r?.id ?? "" }} />
      </div>
    </>
  );
}
