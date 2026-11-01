import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { can, type Permission } from "./permissions";
import { env } from "./env";

export const SESSION_COOKIE = "cmp_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 h
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return "Le mot de passe doit contenir des minuscules, des majuscules et des chiffres.";
  }
  return null;
}

export async function createSession(userId: string, ip: string, userAgent: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt, ip, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Utilisateur courant (mis en cache pour la durée de la requête). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  const { active: _active, ...user } = session.user;
  return user;
});

/** À utiliser dans les pages : redirige vers la connexion ou affiche un refus. */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?refus=1");
  return user;
}

export class ForbiddenError extends Error {
  constructor() {
    super("Accès refusé");
  }
}

/** À utiliser dans les actions serveur et routes API : lève une erreur si non autorisé. */
export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) throw new ForbiddenError();
  return user;
}

let dummy: Promise<string> | null = null;
/** Hachage factice pour garder un temps de réponse constant quand le compte n'existe pas. */
export function dummyHash() {
  dummy ??= bcrypt.hash("dummy-password-for-timing", 12);
  return dummy;
}
