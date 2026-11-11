import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { PageHeader } from "@/components/ui/Section";
import { Markdown } from "@/components/ui/Markdown";

export async function LegalPage({ field, title }: { field: "mentions" | "privacy" | "terms"; title: string }) {
  const { l, t } = await getDictionary();
  const legal = await getSetting("legal");
  return (
    <>
      <PageHeader title={title} />
      <section className="py-16 md:py-24">
        <div className="container-site max-w-3xl">
          {l(legal[field]) ? <Markdown>{l(legal[field])}</Markdown> : <p className="text-muted">{t.common.noContent}</p>}
          {field === "terms" && legal.termsVersion && <p className="mt-12 text-xs text-muted">Version : {legal.termsVersion}</p>}
        </div>
      </section>
    </>
  );
}
