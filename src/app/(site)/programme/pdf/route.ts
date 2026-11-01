import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { buildProgramPdf } from "@/lib/program";

export async function GET() {
  const { t, locale } = await getDictionary();
  const site = await getSetting("site");
  const bytes = await buildProgramPdf(locale, { campaignName: site.campaignName, candidateName: site.candidateName, title: t.program.title });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="programme-${locale}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
