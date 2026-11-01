import type { Role } from "@prisma/client";

export const PERMISSIONS = [
  "dashboard.view",
  "content.manage", // textes d'accueil, candidat, programme
  "news.manage",
  "events.manage",
  "gallery.manage",
  "media.upload",
  "settings.manage", // menu, contact, SEO, mentions légales
  "inbox.view", // messages, bénévoles, newsletter, inscriptions
  "donations.stats", // statistiques agrégées uniquement
  "donations.view", // liste détaillée incluant les données personnelles
  "donations.manage", // confirmation des virements, annulation, reçus
  "donations.export",
  "donations.settings", // montants, moyens de paiement, coordonnées bancaires
  "donations.compliance", // validation de la conformité réglementaire
  "reports.manage",
  "users.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: [
    "dashboard.view",
    "content.manage",
    "news.manage",
    "events.manage",
    "gallery.manage",
    "media.upload",
    "settings.manage",
    "inbox.view",
    "donations.stats",
    "audit.view",
  ],
  EDITOR: ["dashboard.view", "content.manage", "news.manage", "events.manage", "gallery.manage", "media.upload"],
  FINANCE: [
    "dashboard.view",
    "donations.stats",
    "donations.view",
    "donations.manage",
    "donations.export",
    "donations.settings",
    "reports.manage",
    "media.upload",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  FINANCE: "Responsable financier",
};
