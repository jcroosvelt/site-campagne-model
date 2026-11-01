import "server-only";

/** Accès centralisé aux variables d'environnement (côté serveur uniquement). */
function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const env = {
  appUrl: () => read("APP_URL").replace(/\/$/, "") || "http://localhost:3000",
  appSecret: () => {
    const s = read("APP_SECRET");
    if (s.length < 32 && process.env.NODE_ENV === "production") {
      throw new Error("APP_SECRET doit contenir au moins 32 caractères en production.");
    }
    return s || "dev-secret-not-for-production-use-only-000000";
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
