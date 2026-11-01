import { FileText } from "lucide-react";
import { publishedReports } from "@/lib/queries";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export async function UsageCategories() {
  const { t, l } = await getDictionary();
  const cfg = await getSetting("donations");
  return (
    <div>
      <h2 className="h2">{t.donate.usageTitle}</h2>
      <p className="lead mt-4 max-w-2xl">{t.donate.usageIntro}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {cfg.usageCategories.map((c, i) => (
          <li key={i} className="rounded-2xl bg-white p-7">
            <span className={`block h-1.5 w-10 rounded-full ${i % 2 ? "bg-crimson-600" : "bg-flag"}`} aria-hidden />
            <h3 className="mt-5 text-2xl font-extrabold">{l(c.title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{l(c.text)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function FinancialReports() {
  const { t, l, locale } = await getDictionary();
  const reports = await publishedReports();
  return (
    <div>
      <h2 className="h2">{t.donate.reportsTitle}</h2>
      {reports.length === 0 ? (
        <p className="mt-6 text-muted">{t.donate.noReports}</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden />
                <div>
                  <p className="font-medium text-navy-900">{l(r.title)}</p>
                  <p className="text-sm text-muted">{r.period}{r.publishedAt ? ` · ${formatDate(r.publishedAt, locale)}` : ""}</p>
                </div>
              </div>
              <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">{t.common.download}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
