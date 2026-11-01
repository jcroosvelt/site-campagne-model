import { prisma } from "@/lib/db";
import { assertPermission, ForbiddenError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/utils";

/** Export des abonnés ayant CONFIRMÉ leur inscription (double opt-in), pour l'outil d'envoi. */
export async function GET() {
  let user;
  try {
    user = await assertPermission("inbox.view");
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Accès refusé", { status: 403 });
    throw e;
  }
  const rows = await prisma.newsletterSubscriber.findMany({ where: { status: "CONFIRMED" }, orderBy: { confirmedAt: "asc" } });
  await audit(user.id, "newsletter.export", "NewsletterSubscriber", undefined, { count: rows.length });
  const csv = toCsv([["E-mail", "Langue", "Consentement le", "Confirmé le"], ...rows.map((s) => [s.email, s.locale, s.consentAt.toISOString(), s.confirmedAt?.toISOString() ?? ""])]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
