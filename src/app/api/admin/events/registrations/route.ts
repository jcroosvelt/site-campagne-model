import { prisma } from "@/lib/db";
import { assertPermission, ForbiddenError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/utils";

export async function GET(req: Request) {
  let user;
  try {
    user = await assertPermission("events.manage");
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Accès refusé", { status: 403 });
    throw e;
  }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const event = await prisma.event.findUnique({ where: { id }, include: { registrations: { orderBy: { createdAt: "asc" } } } });
  if (!event) return new Response("Introuvable", { status: 404 });
  await audit(user.id, "event.registrations.export", "Event", id, { count: event.registrations.length });
  const csv = toCsv([["Prénom", "Nom", "E-mail", "Téléphone", "Accompagnants", "Inscrit le"], ...event.registrations.map((r) => [r.firstName, r.lastName, r.email, r.phone ?? "", r.guests, r.createdAt.toISOString()])]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="inscriptions-${event.slug}.csv"`, "Cache-Control": "no-store" } });
}
