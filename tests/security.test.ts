import { describe, expect, it, beforeAll } from "vitest";
import Stripe from "stripe";
import { csvCell, isSafeHref, slugify, toVideoEmbed } from "@/lib/utils";
import { buildSchema, SECTIONS } from "@/lib/settings-schema";
import { can } from "@/lib/permissions";
import { looksLikeSpam, signTimestamp } from "@/lib/antispam";
import { haitiLocalToDate, dateToHaitiLocal } from "@/lib/time";
import { validatePasswordStrength } from "@/lib/auth";

beforeAll(() => {
  process.env.APP_SECRET = "x".repeat(64);
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

describe("webhook Stripe signé", () => {
  it("accepte une signature valide et rejette une signature falsifiée", async () => {
    const { constructStripeEvent } = await import("@/lib/payments/stripe");
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_secret" });
    expect(constructStripeEvent(payload, header).id).toBe("evt_1");
    const forged = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_autre" });
    expect(() => constructStripeEvent(payload, forged)).toThrow();
    expect(() => constructStripeEvent(payload.replace("evt_1", "evt_2"), header)).toThrow();
    expect(() => constructStripeEvent(payload, null)).toThrow();
  });
});

describe("moyens de paiement", () => {
  it("n'active aucun moyen tant que la conformité n'est pas validée", async () => {
    const { methodStatuses } = await import("@/lib/payments");
    const cfg = { ...SECTIONS.donations.defaults, enabled: true, cardEnabled: true, moncashEnabled: true, bankEnabled: true, bankName: "B", bankAccountNumber: "1" };
    const compliance = { ...SECTIONS.compliance.defaults, cardValidated: true, moncashValidated: true, bankValidated: true };
    expect(methodStatuses(cfg as never, compliance as never).every((m) => !m.available)).toBe(true);
    const full = Object.fromEntries(Object.entries(compliance).map(([k, v]) => [k, typeof v === "boolean" ? true : v]));
    const res = methodStatuses(cfg as never, full as never);
    expect(res.find((m) => m.method === "BANK_TRANSFER")?.available).toBe(true);
    // carte : identifiants présents dans ce test → actif ; MonCash : identifiants absents → bloqué
    expect(res.find((m) => m.method === "CARD")?.available).toBe(true);
    expect(res.find((m) => m.method === "MONCASH")?.blockers).toContain("Identifiants du prestataire absents de l'environnement");
  });
});

describe("protections", () => {
  it("neutralise l'injection de formules CSV", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell('a"b')).toBe(`"a""b"`);
  });
  it("refuse les URL javascript: dans les paramètres", () => {
    const schema = buildSchema(SECTIONS.contact.fields);
    const ok = { ...SECTIONS.contact.defaults, facebook: "https://facebook.com/x" };
    expect(schema.safeParse(ok).success).toBe(true);
    expect(schema.safeParse({ ...ok, facebook: "javascript:alert(1)" }).success).toBe(false);
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
  });
  it("n'intègre que YouTube et Vimeo", () => {
    expect(toVideoEmbed("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(toVideoEmbed("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
    expect(toVideoEmbed("https://evil.example/embed")).toBeNull();
  });
  it("applique les permissions par rôle", () => {
    expect(can("EDITOR", "donations.view")).toBe(false);
    expect(can("ADMIN", "donations.view")).toBe(false);
    expect(can("ADMIN", "donations.stats")).toBe(true);
    expect(can("FINANCE", "donations.view")).toBe(true);
    expect(can("FINANCE", "donations.compliance")).toBe(false);
    expect(can("FINANCE", "users.manage")).toBe(false);
    expect(can("SUPER_ADMIN", "donations.compliance")).toBe(true);
  });
  it("détecte les soumissions de robots", () => {
    const fd = (ts: string, hp = "") => { const f = new FormData(); f.set("_ts", ts); f.set("website_url", hp); return f; };
    expect(looksLikeSpam(fd(signTimestamp(Date.now() - 10000)))).toBe(false);
    expect(looksLikeSpam(fd(signTimestamp(Date.now())))).toBe(true); // trop rapide
    expect(looksLikeSpam(fd(signTimestamp(Date.now() - 10000), "spam"))).toBe(true); // pot de miel
    expect(looksLikeSpam(fd(`${Date.now() - 10000}.falsifie`))).toBe(true); // horodatage non signé
  });
  it("impose des mots de passe robustes", () => {
    expect(validatePasswordStrength("court")).not.toBeNull();
    expect(validatePasswordStrength("toutenminuscule123")).not.toBeNull();
    expect(validatePasswordStrength("UnMotDePasse2026")).toBeNull();
  });
});

describe("divers", () => {
  it("slugify", () => expect(slugify("Éducation & Santé : l'avenir")).toBe("education-sante-l-avenir"));
  it("convertit l'heure d'Haïti (avec changement d'heure)", () => {
    expect(haitiLocalToDate("2026-01-15T10:00")?.toISOString()).toBe("2026-01-15T15:00:00.000Z");
    expect(haitiLocalToDate("2026-07-15T10:00")?.toISOString()).toBe("2026-07-15T14:00:00.000Z");
    expect(dateToHaitiLocal(new Date("2026-07-15T14:00:00Z"))).toBe("2026-07-15T10:00");
  });
});
