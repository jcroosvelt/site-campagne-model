import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Une base de données est-elle configurée ? Sans base, le site public s'affiche avec les
 * contenus par défaut (src/lib/demo-content.ts) ; formulaires et administration nécessitent la base.
 */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
