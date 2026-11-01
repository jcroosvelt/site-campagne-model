import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getClientIp } from "./request";

/** Journal d'audit des opérations sensibles. Ne jamais y consigner de secret ni de mot de passe. */
export async function audit(
  userId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  details?: Prisma.InputJsonValue,
) {
  let ip: string | null = null;
  try {
    ip = await getClientIp();
  } catch {
    ip = null;
  }
  await prisma.auditLog.create({ data: { userId, action, entity, entityId, details, ip } });
}
