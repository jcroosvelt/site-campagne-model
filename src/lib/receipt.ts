import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Donation } from "@prisma/client";
import { formatDate, formatMoney } from "./utils";
import { METHOD_LABELS_FR } from "./donation-status";

/** Les polices standard PDF utilisent WinAnsi : on remplace les caractères non encodables. */
export function winAnsi(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ | /g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF\n€]/g, "");
}

/** Découpe un texte en lignes tenant dans la largeur donnée. */
export function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export async function buildReceiptPdf(d: Donation, opts: { campaignName: string; legalEntity: string }): Promise<Uint8Array> {
  if (d.status !== "CONFIRMED" || !d.receiptNumber) throw new Error("Reçu disponible uniquement pour un don confirmé");
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Reçu ${d.receiptNumber}`);
  pdf.setAuthor(winAnsi(opts.legalEntity));
  const page = pdf.addPage([595.28, 841.89]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.043, 0.122, 0.227);
  const red = rgb(0.784, 0.063, 0.18);
  const gold = rgb(0.72, 0.58, 0.29);
  const grey = rgb(0.35, 0.38, 0.43);

  page.drawRectangle({ x: 0, y: 801.89, width: 595.28, height: 40, color: navy });
  page.drawRectangle({ x: 0, y: 797.89, width: 595.28, height: 4, color: red });
  page.drawText(winAnsi(opts.campaignName).toUpperCase(), { x: 50, y: 816, size: 12, font: sansBold, color: rgb(1, 1, 1) });

  page.drawText("Reçu de contribution", { x: 50, y: 740, size: 26, font: serifBold, color: navy });
  page.drawRectangle({ x: 50, y: 728, width: 60, height: 2, color: gold });
  page.drawText(winAnsi(`N° ${d.receiptNumber}`), { x: 50, y: 705, size: 12, font: sans, color: grey });

  const rows: [string, string][] = [
    ["Donateur", `${d.firstName} ${d.lastName}`],
    ["Adresse e-mail", d.email],
    ["Pays de résidence", d.country],
    ["Montant", formatMoney(d.amountCents, d.currency)],
    ["Moyen de paiement", METHOD_LABELS_FR[d.method]],
    ["Référence de la contribution", d.reference],
    ["Référence du prestataire", d.providerPaymentId ?? d.providerRef ?? "-"],
    ["Date de confirmation", d.confirmedAt ? formatDate(d.confirmedAt, "fr", { dateStyle: "long", timeStyle: "short" }) : "-"],
    ["Statut", "Confirmé"],
  ];
  let y = 650;
  for (const [label, value] of rows) {
    page.drawText(winAnsi(label), { x: 50, y, size: 10, font: sans, color: grey });
    page.drawText(winAnsi(value), { x: 230, y, size: 12, font: label === "Montant" ? serifBold : serif, color: navy });
    page.drawLine({ start: { x: 50, y: y - 10 }, end: { x: 545, y: y - 10 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.88) });
    y -= 34;
  }

  const notice = wrapText(
    winAnsi(
      `Le présent reçu atteste la réception d'une contribution volontaire par ${opts.legalEntity}, confirmée par le prestataire de paiement ou par rapprochement bancaire. Les contributions sont soumises aux règles de financement politique en vigueur et peuvent faire l'objet d'une déclaration aux autorités compétentes conformément à la loi.`,
    ),
    sans,
    9.5,
    495,
  );
  y -= 10;
  for (const line of notice) {
    page.drawText(winAnsi(line), { x: 50, y, size: 9.5, font: sans, color: grey });
    y -= 14;
  }
  page.drawText(winAnsi(`Document généré le ${formatDate(new Date(), "fr", { dateStyle: "long" })}`), {
    x: 50,
    y: 50,
    size: 8,
    font: sans,
    color: grey,
  });
  return pdf.save();
}
