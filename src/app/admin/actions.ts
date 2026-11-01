"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertPermission, createSession, destroySession, dummyHash, ForbiddenError, getCurrentUser, hashPassword,
  LOCK_DURATION_MS, MAX_FAILED_LOGINS, validatePasswordStrength, verifyPassword,
} from "@/lib/auth";
import type { Permission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { buildSchema, SECTIONS, type Field, type SectionKey } from "@/lib/settings-schema";
import { getSetting, saveSetting } from "@/lib/settings";
import { articleFields, categoryFields, eventFields, mediaFields, reportFields, themeFields } from "@/lib/admin-forms";
import { haitiLocalToDate } from "@/lib/time";
import { slugify } from "@/lib/utils";
import { fieldErrors, type FormState } from "@/lib/forms";
import { confirmDonation, sendReceiptEmail, transitionDonation } from "@/lib/donations";

// ───────────────────────────────────────── Utilitaires

/** Exécute une action protégée : contrôle d'accès, validation, gestion d'erreurs homogène. */
async function guarded(permission: Permission, fn: (user: { id: string; role: Role }) => Promise<FormState>): Promise<FormState> {
  try {
    const user = await assertPermission(permission);
    return await fn(user);
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, message: "Vous n'avez pas les droits nécessaires pour cette opération." };
    if (e instanceof z.ZodError) return { ok: false, message: "Certains champs sont invalides.", errors: fieldErrors(e) };
    if ((e as { code?: string }).code === "P2002") return { ok: false, message: "Cet identifiant d'URL (slug) est déjà utilisé.", errors: { slug: "Déjà utilisé" } };
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("[admin] erreur", e);
    return { ok: false, message: "Une erreur inattendue est survenue." };
  }
}

function payload(fd: FormData, fields: Field[]) {
  const raw = JSON.parse(String(fd.get("payload") ?? "{}"));
  return buildSchema(fields).parse(raw) as Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const json = (v: unknown) => v as Prisma.InputJsonValue;
const dt = (v: unknown) => (str(v) ? haitiLocalToDate(str(v)) : null);
function makeSlug(given: unknown, title: unknown) {
  const s = slugify(str(given) || str((title as { fr?: string })?.fr));
  if (!s) throw new z.ZodError([{ code: "custom", path: ["slug"], message: "Titre ou slug requis", input: given }]);
  return s;
}
function requireFr(title: unknown, path = "title") {
  if (!str((title as { fr?: string })?.fr).trim()) throw new z.ZodError([{ code: "custom", path: [path], message: "Le titre en français est obligatoire", input: title }]);
}

// ───────────────────────────────────────── Authentification

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(fd.get("password") ?? "").slice(0, 200);
  const ip = await getClientIp();
  const generic = { ok: false, message: "Identifiants incorrects." };

  if (!(await rateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000)).ok) return { ok: false, message: "Trop de tentatives. Réessayez dans 15 minutes." };
  if (!email || !password) return generic;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    await verifyPassword(password, await dummyHash()); // temps constant
    await audit(null, "auth.login.failed", "User", undefined, { email });
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, message: "Compte temporairement verrouillé après plusieurs échecs. Réessayez plus tard." };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: failed, lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_DURATION_MS) : null },
    });
    await audit(user.id, failed >= MAX_FAILED_LOGINS ? "auth.account.locked" : "auth.login.failed", "User", user.id);
    return generic;
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  await createSession(user.id, ip, await getUserAgent());
  await resetRateLimit(`login:ip:${ip}`);
  await audit(user.id, "auth.login.success", "User", user.id);
  redirect("/admin");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, "auth.logout", "User", user.id);
  redirect("/admin/login");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return { ok: false, message: "Les mots de passe ne correspondent pas." };
  const weak = validatePasswordStrength(next);
  if (weak) return { ok: false, message: weak };
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, row.passwordHash))) return { ok: false, message: "Mot de passe actuel incorrect." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id, await getClientIp(), await getUserAgent());
  await audit(user.id, "auth.password.changed", "User", user.id);
  return { ok: true, message: "Mot de passe modifié. Les autres sessions ont été fermées." };
}

// ───────────────────────────────────────── Paramètres

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const section = String(fd.get("section")) as SectionKey;
  if (!(section in SECTIONS)) return { ok: false, message: "Section inconnue." };
  return guarded(SECTIONS[section].permission as Permission, async (user) => {
    const before = await getSetting(section);
    const raw = JSON.parse(String(fd.get("payload") ?? "{}"));
    if (section === "donations") {
      raw.presetAmounts = (raw.presetAmounts as string[]).map((s) => s.replace(/\D/g, "")).filter(Boolean);
      raw.allowedCountries = (raw.allowedCountries as string[]).map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s));
      raw.attestations = (raw.attestations as { id: string }[]).map((a) => ({ ...a, id: slugify(a.id) || `declaration-${Math.random().toString(36).slice(2, 6)}` }));
    }
    const saved = await saveSetting(section, raw);
    const changed = Object.keys(saved).filter((k) => JSON.stringify((saved as Record<string, unknown>)[k]) !== JSON.stringify((before as Record<string, unknown>)[k]));
    const sensitive = section === "donations" || section === "compliance";
    await audit(user.id, `settings.${section}.update`, "Setting", section, sensitive ? { changed, after: Object.fromEntries(changed.map((k) => [k, (saved as Record<string, unknown>)[k]])) as Prisma.InputJsonValue } : { changed });
    revalidatePath("/", "layout");
    return { ok: true, message: "Modifications enregistrées." };
  });
}

export async function setProgramPdfAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("content.manage", async (user) => {
    const { url } = payload(fd, [{ name: "url", label: "", type: "file" }]);
    await prisma.setting.upsert({ where: { key: "programPdf" }, create: { key: "programPdf", value: { url: str(url) } }, update: { value: { url: str(url) } } });
    await audit(user.id, "program.pdf.update", "Setting", "programPdf", { url: str(url) });
    return { ok: true, message: str(url) ? "PDF officiel enregistré." : "Le PDF sera généré automatiquement à partir du programme." };
  });
}

// ───────────────────────────────────────── Programme

export async function saveThemeAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("content.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const v = payload(fd, themeFields);
    requireFr(v.title);
    const measures = v.measures as Record<string, string[]>;
    const data = {
      title: json(v.title), slug: makeSlug(v.slug, v.title), icon: str(v.icon), order: Number(v.order), summary: json(v.summary), body: json(v.body),
      measures: json(Object.fromEntries(Object.entries(measures).map(([k, arr]) => [k, arr.map((s) => s.trim()).filter(Boolean)]))),
      image: str(v.image) || null, published: Boolean(v.published),
    };
    const row = id ? await prisma.programTheme.update({ where: { id }, data }) : await prisma.programTheme.create({ data });
    await audit(user.id, id ? "program.update" : "program.create", "ProgramTheme", row.id);
    revalidatePath("/programme");
    if (!id) redirect(`/admin/programme/${row.id}?cree=1`);
    return { ok: true, message: "Thématique enregistrée." };
  });
}

// ───────────────────────────────────────── Actualités

export async function saveArticleAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("news.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const cats = await prisma.articleCategory.findMany({ select: { id: true } });
    const v = payload(fd, articleFields(cats.map((c) => ({ id: c.id, name: "" }))));
    requireFr(v.title);
    let publishedAt = dt(v.publishedAt);
    if (v.status === "PUBLISHED" && !publishedAt) publishedAt = new Date();
    const data = {
      title: json(v.title), slug: makeSlug(v.slug, v.title), excerpt: json(v.excerpt), body: json(v.body),
      categoryId: str(v.categoryId) || null, coverImage: str(v.coverImage) || null, coverAlt: str(v.coverAlt) || null,
      videoUrl: str(v.videoUrl) || null, status: v.status as "DRAFT" | "PUBLISHED" | "ARCHIVED", publishedAt,
      featured: Boolean(v.featured), seoTitle: str(v.seoTitle) || null, seoDescription: str(v.seoDescription) || null,
    };
    const row = id ? await prisma.article.update({ where: { id }, data }) : await prisma.article.create({ data: { ...data, authorId: user.id } });
    await audit(user.id, id ? "article.update" : "article.create", "Article", row.id, { status: row.status });
    revalidatePath("/actualites");
    if (!id) redirect(`/admin/actualites/${row.id}?cree=1`);
    const scheduled = row.status === "PUBLISHED" && row.publishedAt && row.publishedAt > new Date();
    return { ok: true, message: scheduled ? "Article enregistré — publication programmée." : "Article enregistré." };
  });
}

export async function saveCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("news.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const v = payload(fd, categoryFields);
    requireFr(v.name, "name");
    const data = { name: json(v.name), slug: makeSlug(v.slug, v.name), order: Number(v.order) };
    const row = id ? await prisma.articleCategory.update({ where: { id }, data }) : await prisma.articleCategory.create({ data });
    await audit(user.id, id ? "category.update" : "category.create", "ArticleCategory", row.id);
    revalidatePath("/admin/actualites/categories");
    if (!id) redirect("/admin/actualites/categories");
    return { ok: true, message: "Catégorie enregistrée." };
  });
}

// ───────────────────────────────────────── Agenda

export async function saveEventAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("events.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const v = payload(fd, eventFields);
    requireFr(v.title);
    const startsAt = dt(v.startsAt);
    if (!startsAt) throw new z.ZodError([{ code: "custom", path: ["startsAt"], message: "Date de début obligatoire", input: v.startsAt }]);
    const endsAt = dt(v.endsAt);
    if (endsAt && endsAt < startsAt) throw new z.ZodError([{ code: "custom", path: ["endsAt"], message: "La fin doit être après le début", input: v.endsAt }]);
    const data = {
      title: json(v.title), slug: makeSlug(v.slug, v.title), type: v.type as "MEETING", startsAt, endsAt,
      venue: str(v.venue), address: str(v.address) || null, city: str(v.city), description: json(v.description),
      image: str(v.image) || null, registrationEnabled: Boolean(v.registrationEnabled), capacity: Number(v.capacity) || null, published: Boolean(v.published),
    };
    const row = id ? await prisma.event.update({ where: { id }, data }) : await prisma.event.create({ data });
    await audit(user.id, id ? "event.update" : "event.create", "Event", row.id);
    revalidatePath("/agenda");
    if (!id) redirect(`/admin/agenda/${row.id}?cree=1`);
    return { ok: true, message: "Événement enregistré." };
  });
}

// ───────────────────────────────────────── Galerie

export async function saveMediaAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("gallery.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const v = payload(fd, mediaFields);
    if (v.type === "PHOTO" && !str(v.imageUrl)) throw new z.ZodError([{ code: "custom", path: ["imageUrl"], message: "Photo obligatoire", input: "" }]);
    if (v.type === "VIDEO" && !str(v.videoUrl)) throw new z.ZodError([{ code: "custom", path: ["videoUrl"], message: "URL de vidéo obligatoire", input: "" }]);
    const data = {
      title: json(v.title), type: v.type as "PHOTO" | "VIDEO", category: v.category as "OTHER", imageUrl: str(v.imageUrl) || null,
      videoUrl: str(v.videoUrl) || null, takenAt: dt(v.takenAt), order: Number(v.order), published: Boolean(v.published),
    };
    const row = id ? await prisma.mediaItem.update({ where: { id }, data }) : await prisma.mediaItem.create({ data });
    await audit(user.id, id ? "media.update" : "media.create", "MediaItem", row.id);
    revalidatePath("/galerie");
    if (!id) redirect(`/admin/galerie/${row.id}?cree=1`);
    return { ok: true, message: "Élément enregistré." };
  });
}

// ───────────────────────────────────────── Rapports financiers

export async function saveReportAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("reports.manage", async (user) => {
    const id = String(fd.get("id") ?? "");
    const v = payload(fd, reportFields);
    requireFr(v.title);
    const published = Boolean(v.published);
    const existing = id ? await prisma.financialReport.findUnique({ where: { id } }) : null;
    const data = {
      title: json(v.title), period: str(v.period), description: json(v.description), fileUrl: str(v.fileUrl), published,
      publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
    };
    const row = id ? await prisma.financialReport.update({ where: { id }, data }) : await prisma.financialReport.create({ data });
    await audit(user.id, id ? "report.update" : "report.create", "FinancialReport", row.id, { published });
    revalidatePath("/transparence");
    if (!id) redirect(`/admin/rapports/${row.id}?cree=1`);
    return { ok: true, message: "Rapport enregistré." };
  });
}

// ───────────────────────────────────────── Suppressions

const DELETABLE = {
  theme: { perm: "content.manage", run: (id: string) => prisma.programTheme.delete({ where: { id } }), back: "/admin/programme" },
  article: { perm: "news.manage", run: (id: string) => prisma.article.delete({ where: { id } }), back: "/admin/actualites" },
  category: { perm: "news.manage", run: (id: string) => prisma.articleCategory.delete({ where: { id } }), back: "/admin/actualites/categories" },
  event: { perm: "events.manage", run: (id: string) => prisma.event.delete({ where: { id } }), back: "/admin/agenda" },
  registration: { perm: "events.manage", run: (id: string) => prisma.eventRegistration.delete({ where: { id } }), back: null },
  media: { perm: "gallery.manage", run: (id: string) => prisma.mediaItem.delete({ where: { id } }), back: "/admin/galerie" },
  report: { perm: "reports.manage", run: (id: string) => prisma.financialReport.delete({ where: { id } }), back: "/admin/rapports" },
  contact: { perm: "inbox.view", run: (id: string) => prisma.contactMessage.delete({ where: { id } }), back: null },
  volunteer: { perm: "inbox.view", run: (id: string) => prisma.volunteer.delete({ where: { id } }), back: null },
  subscriber: { perm: "inbox.view", run: (id: string) => prisma.newsletterSubscriber.delete({ where: { id } }), back: null },
} as const;

export async function deleteAction(fd: FormData) {
  const kind = String(fd.get("kind")) as keyof typeof DELETABLE;
  const id = String(fd.get("id"));
  const def = DELETABLE[kind];
  if (!def) return;
  const user = await assertPermission(def.perm as Permission);
  await def.run(id);
  await audit(user.id, `${kind}.delete`, kind, id);
  revalidatePath("/", "layout");
  if (def.back) redirect(def.back);
}

const INBOX_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "ARCHIVED"] as const;
export async function setInboxStatusAction(fd: FormData) {
  const user = await assertPermission("inbox.view");
  const kind = String(fd.get("kind"));
  const id = String(fd.get("id"));
  const status = z.enum(INBOX_STATUSES).parse(fd.get("status"));
  if (kind === "contact") await prisma.contactMessage.update({ where: { id }, data: { status } });
  else if (kind === "volunteer") await prisma.volunteer.update({ where: { id }, data: { status } });
  else return;
  await audit(user.id, `${kind}.status`, kind, id, { status });
  revalidatePath("/admin/messages");
}

// ───────────────────────────────────────── Dons (opérations financières)

const bankConfirmSchema = z.object({ id: z.string().min(1), bankReference: z.string().trim().min(3).max(120), receivedAmount: z.coerce.number().positive() });

/** Confirmation d'un virement après rapprochement bancaire (le montant reçu doit correspondre). */
export async function confirmBankTransferAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("donations.manage", async (user) => {
    const v = bankConfirmSchema.parse(Object.fromEntries(fd));
    const d = await prisma.donation.findUniqueOrThrow({ where: { id: v.id } });
    if (d.method !== "BANK_TRANSFER") return { ok: false, message: "Seuls les virements peuvent être confirmés manuellement. Les autres moyens sont confirmés par le prestataire." };
    if (d.status !== "PENDING") return { ok: false, message: "Ce don n'est pas en attente." };
    const receivedCents = Math.round(v.receivedAmount * 100);
    if (receivedCents !== d.amountCents) return { ok: false, message: "Le montant reçu ne correspond pas au montant annoncé. Contactez le donateur ou annulez puis enregistrez un nouveau don." };
    const ok = await confirmDonation(d, { providerPaymentId: `VIR:${v.bankReference}`, amountCents: receivedCents, currency: d.currency }, `admin:${user.id}`);
    await audit(user.id, "donation.bank.confirm", "Donation", d.id, { bankReference: v.bankReference, amountCents: receivedCents });
    revalidatePath(`/admin/dons/${d.id}`);
    return ok ? { ok: true, message: "Virement confirmé. Le reçu a été émis." } : { ok: false, message: "La confirmation a échoué (statut modifié entre-temps ?)." };
  });
}

export async function cancelDonationAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("donations.manage", async (user) => {
    const id = String(fd.get("id"));
    const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
    if (reason.length < 3) return { ok: false, message: "Indiquez un motif." };
    const ok = await transitionDonation(id, "CANCELLED", { failureReason: reason });
    await audit(user.id, "donation.cancel", "Donation", id, { reason, ok });
    revalidatePath(`/admin/dons/${id}`);
    return ok ? { ok: true, message: "Don annulé." } : { ok: false, message: "Seul un don en attente peut être annulé." };
  });
}

export async function refundBankDonationAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("donations.manage", async (user) => {
    const id = String(fd.get("id"));
    const note = String(fd.get("note") ?? "").trim().slice(0, 300);
    const d = await prisma.donation.findUniqueOrThrow({ where: { id } });
    if (d.method !== "BANK_TRANSFER") return { ok: false, message: "Les remboursements carte et MonCash sont effectués chez le prestataire ; le statut est mis à jour automatiquement." };
    if (note.length < 3) return { ok: false, message: "Indiquez la référence du virement de remboursement." };
    const ok = await transitionDonation(id, "REFUNDED", { notes: `Remboursement : ${note}` });
    await audit(user.id, "donation.refund", "Donation", id, { note, ok });
    revalidatePath(`/admin/dons/${id}`);
    return ok ? { ok: true, message: "Don marqué comme remboursé." } : { ok: false, message: "Seul un don confirmé peut être remboursé." };
  });
}

export async function resendReceiptAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("donations.manage", async (user) => {
    const id = String(fd.get("id"));
    const sent = await sendReceiptEmail(id);
    await audit(user.id, "donation.receipt.resend", "Donation", id, { sent });
    revalidatePath(`/admin/dons/${id}`);
    return sent ? { ok: true, message: "Reçu envoyé." } : { ok: false, message: "Envoi impossible (don non confirmé ou SMTP non configuré)." };
  });
}

export async function saveDonationNoteAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("donations.manage", async (user) => {
    const id = String(fd.get("id"));
    const notes = String(fd.get("notes") ?? "").slice(0, 2000);
    await prisma.donation.update({ where: { id }, data: { notes } });
    await audit(user.id, "donation.note", "Donation", id);
    return { ok: true, message: "Note enregistrée." };
  });
}

// ───────────────────────────────────────── Utilisateurs

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "FINANCE"] as const;
const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ROLES),
  password: z.string().max(200).optional(),
  active: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveUserAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded("users.manage", async (actor) => {
    const id = String(fd.get("id") ?? "");
    const v = userSchema.parse(Object.fromEntries(fd));
    if (id === actor.id && (v.role !== "SUPER_ADMIN" || !v.active)) return { ok: false, message: "Vous ne pouvez pas retirer vos propres droits de super administrateur." };
    if (!id || v.password) {
      const weak = validatePasswordStrength(v.password ?? "");
      if (weak) return { ok: false, message: weak, errors: { password: weak } };
    }
    const data = { name: v.name, email: v.email, role: v.role, active: v.active, ...(v.password ? { passwordHash: await hashPassword(v.password), failedLogins: 0, lockedUntil: null } : {}) };
    const row = id ? await prisma.user.update({ where: { id }, data }) : await prisma.user.create({ data: data as Prisma.UserCreateInput });
    if (id && (!v.active || v.password)) await prisma.session.deleteMany({ where: { userId: id } });
    await audit(actor.id, id ? "user.update" : "user.create", "User", row.id, { role: v.role, active: v.active, passwordChanged: Boolean(v.password) });
    revalidatePath("/admin/utilisateurs");
    if (!id) redirect("/admin/utilisateurs");
    return { ok: true, message: "Utilisateur enregistré." };
  });
}
