import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { hasDatabase, prisma } from "./db";
import { publishedThemes } from "./queries";
import { localize, localizeList, type Locale } from "./i18n-shared-server";
import { winAnsi, wrapText } from "./receipt";

/** Si un PDF officiel a été déposé dans l'administration, il est prioritaire ; sinon PDF généré. */
export async function getProgramPdfUrl(): Promise<string> {
  if (!hasDatabase()) return "/programme/pdf";
  const row = await prisma.setting.findUnique({ where: { key: "programPdf" } });
  const url = (row?.value as { url?: string } | null)?.url;
  return url || "/programme/pdf";
}

function stripMd(s: string) {
  return s.replace(/[*_`>#]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

const wrap = wrapText;

export async function buildProgramPdf(locale: Locale, opts: { campaignName: string; candidateName: string; title: string }) {
  const themes = await publishedThemes();
  const pdf = await PDFDocument.create();
  pdf.setTitle(winAnsi(`${opts.title} — ${opts.campaignName}`));
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.043, 0.122, 0.227);
  const red = rgb(0.784, 0.063, 0.18);
  const gold = rgb(0.72, 0.58, 0.29);
  const W = 595.28, H = 841.89, M = 60, CW = W - 2 * M;

  // Couverture
  const cover = pdf.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
  cover.drawRectangle({ x: M, y: 470, width: 60, height: 3, color: gold });
  cover.drawText(winAnsi(opts.title), { x: M, y: 420, size: 40, font: serifBold, color: rgb(1, 1, 1) });
  cover.drawText(winAnsi(opts.candidateName), { x: M, y: 380, size: 20, font: serif, color: rgb(0.86, 0.78, 0.6) });
  cover.drawText(winAnsi(opts.campaignName.toUpperCase()), { x: M, y: 80, size: 10, font: sans, color: rgb(1, 1, 1) });
  cover.drawRectangle({ x: 0, y: 0, width: W, height: 8, color: red });

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const ensure = (h: number) => {
    if (y - h < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };
  const write = (text: string, font: PDFFont, size: number, color = navy, gap = 4) => {
    for (const line of wrap(winAnsi(stripMd(text)), font, size, CW)) {
      ensure(size + gap);
      page.drawText(line, { x: M, y: y - size, size, font, color });
      y -= size + gap;
    }
  };

  themes.forEach((th, i) => {
    ensure(120);
    if (i > 0) y -= 24;
    page.drawText(String(i + 1).padStart(2, "0"), { x: M, y: y - 12, size: 12, font: sans, color: gold });
    y -= 22;
    write(localize(th.title, locale), serifBold, 22, navy, 6);
    y -= 4;
    write(localize(th.summary, locale), serif, 12, rgb(0.35, 0.38, 0.43), 4);
    y -= 8;
    write(localize(th.body, locale), serif, 11, navy, 4);
    const measures = localizeList(th.measures, locale);
    if (measures.length) {
      y -= 8;
      for (const m of measures) write(`- ${m}`, sans, 10, navy, 4);
    }
  });
  return pdf.save();
}
