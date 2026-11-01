import "server-only";
import { createHash } from "node:crypto";

/** Accès centralisé aux variables d'environnement (côté serveur uniquement). */
function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const env = {
  appUrl: () => read("APP_URL").replace(/\/$/, "") || "http://localhost:3000",
  /**
   * Secret serveur (anti-spam, empreintes de visite). Recommandé : APP_SECRET (≥ 32 caractères).
   * À défaut, on dérive une valeur stable de DATABASE_URL (secrète et identique sur toutes les
   * instances) pour que le site fonctionne dès le premier déploiement.
   */
  appSecret: () => {
    const s = read("APP_SECRET");
    if (s.length >= 32) return s;
    const db = read("DATABASE_URL");
    if (db) return createHash("sha256").update(`app-secret|${db}`).digest("hex");
    return "dev-secret-not-for-production-use-only-000000";
  },
  isProd: () => process.env.NODE_ENV === "production",
  smtp: () => ({
    host: read("SMTP_HOST"),
    port: Number(read("SMTP_PORT") || 587),
    user: read("SMTP_USER"),
    password: read("SMTP_PASSWORD"),
    secure: read("SMTP_SECURE") === "true",
    from: read("MAIL_FROM") || "Campagne <no-reply@localhost>",
  }),
  storage: () => ({
    driver: (read("STORAGE_DRIVER") || "local") as "local" | "supabase",
    supabaseUrl: read("SUPABASE_URL").replace(/\/$/, ""),
    supabaseKey: read("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: read("SUPABASE_STORAGE_BUCKET") || "public-media",
  }),
  stripe: () => ({ secretKey: read("STRIPE_SECRET_KEY"), webhookSecret: read("STRIPE_WEBHOOK_SECRET") }),
  moncash: () => ({
    mode: (read("MONCASH_MODE") || "sandbox") as "sandbox" | "live",
    clientId: read("MONCASH_CLIENT_ID"),
    clientSecret: read("MONCASH_CLIENT_SECRET"),
    notifyKey: read("MONCASH_NOTIFY_KEY"),
  }),
};
