import "server-only";
import { prisma } from "./db";

/**
 * Limiteur à fenêtre fixe stocké en base (atomique via INSERT … ON CONFLICT).
 * Fonctionne en environnement multi-instance sans dépendance supplémentaire.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; count: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN NOW() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  return { ok: count <= limit, count };
}

export async function resetRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } });
}
