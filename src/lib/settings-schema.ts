/**
 * Paramètres administrables décrits de façon déclarative.
 * Le même descripteur sert à générer le formulaire d'administration ET la validation serveur (zod).
 */
import { z } from "zod";

export type Field =
  | { name: string; label: string; type: "text" | "textarea" | "email" | "url" | "image" | "file"; help?: string; required?: boolean }
  | { name: string; label: string; type: "number"; help?: string; min?: number; max?: number }
  | { name: string; label: string; type: "boolean"; help?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "l10n" | "l10nText" | "l10nMarkdown"; help?: string }
  | { name: string; label: string; type: "stringList"; help?: string }
  | { name: string; label: string; type: "datetime"; help?: string }
  | { name: string; label: string; type: "l10nLines"; help?: string }
  | { name: string; label: string; type: "list"; fields: Field[]; help?: string; itemLabel?: string };

const l10nSchema = z.object({ fr: z.string().max(20000), ht: z.string().max(20000), en: z.string().max(20000) });
const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v) || /^mailto:|^tel:/i.test(v), "URL invalide");

function fieldSchema(f: Field): z.ZodTypeAny {
  switch (f.type) {
    case "text":
    case "textarea":
      return z.string().trim().max(5000);
    case "email":
      return z.union([z.literal(""), z.string().trim().email()]);
    case "url":
    case "image":
    case "file":
      return safeUrl;
    case "number":
      return z.coerce.number().min(f.min ?? -1e12).max(f.max ?? 1e12);
    case "boolean":
      return z.boolean();
    case "select":
      return z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    case "l10n":
    case "l10nText":
    case "l10nMarkdown":
      return l10nSchema;
    case "stringList":
      return z.array(z.string().trim().max(500)).max(100);
    case "datetime":
      return z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date invalide")]);
    case "l10nLines":
      return z.object({ fr: z.array(z.string().trim().max(1000)).max(100), ht: z.array(z.string().trim().max(1000)).max(100), en: z.array(z.string().trim().max(1000)).max(100) });
    case "list":
      return z.array(buildSchema(f.fields)).max(100);
  }
}

/** Les champs "required" textuels ne peuvent pas être vides. */
function withRequired(f: Field, schema: z.ZodTypeAny): z.ZodTypeAny {
  if ("required" in f && f.required && schema instanceof z.ZodString) return schema.min(1, "Champ obligatoire");
  return schema;
}

export function buildSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.name, withRequired(f, fieldSchema(f))])));
}

// ─────────────────────────────────────────── Sections

const L = (fr: string, ht = "", en = "") => ({ fr, ht, en });

export const SECTIONS = {
  site: {
    title: "Identité de la campagne",
    permission: "content.manage",
    fields: [
      { name: "campaignName", label: "Nom de la campagne", type: "text" },
      { name: "candidateName", label: "Nom complet du candidat", type: "text" },
      { name: "logoUrl", label: "Logo (laisser vide pour le logo typographique)", type: "image" },
      { name: "electionLabel", label: "Libellé de l'élection", type: "l10n" },
      { name: "slogan", label: "Slogan", type: "l10n" },
      { name: "heroMessage", label: "Message principal (hero)", type: "l10nText" },
      { name: "heroImage", label: "Photo officielle (hero)", type: "image" },
      { name: "legalEntity", label: "Entité juridique responsable (mentions, reçus)", type: "text" },
    ] as Field[],
    defaults: {
      campaignName: "",
      candidateName: "",
      logoUrl: "",
      electionLabel: L("", "", ""),
      slogan: L("", "", ""),
      heroMessage: L("", "", ""),
      heroImage: "",
      legalEntity: "",
    },
  },
  home: {
    title: "Page d'accueil",
    permission: "content.manage",
    fields: [
      { name: "messageTitle", label: "Message du candidat — titre", type: "l10n" },
      { name: "messageBody", label: "Message du candidat — texte", type: "l10nMarkdown" },
      { name: "messageSignature", label: "Signature", type: "text" },
      { name: "visionTitle", label: "Vision — titre", type: "l10n" },
      { name: "visionBody", label: "Vision — texte", type: "l10nText" },
      {
        name: "visionPillars",
        label: "Piliers de la vision",
        type: "list",
        itemLabel: "Pilier",
        fields: [
          { name: "title", label: "Titre", type: "l10n" },
          { name: "text", label: "Texte", type: "l10nText" },
        ],
      },
      { name: "participationTitle", label: "Participation — titre", type: "l10n" },
      { name: "participationBody", label: "Participation — texte", type: "l10nText" },
      { name: "donationTitle", label: "Soutien financier — titre", type: "l10n" },
      { name: "donationBody", label: "Soutien financier — texte", type: "l10nText" },
      { name: "newsletterTitle", label: "Newsletter — titre", type: "l10n" },
      { name: "newsletterBody", label: "Newsletter — texte", type: "l10nText" },
    ] as Field[],
    defaults: {
      messageTitle: L("", "", ""),
      messageBody: L("", "", ""),
      messageSignature: "",
      visionTitle: L("", "", ""),
      visionBody: L("", "", ""),
      visionPillars: [] as { title: ReturnType<typeof L>; text: ReturnType<typeof L> }[],
      participationTitle: L("", "", ""),
      participationBody: L("", "", ""),
      donationTitle: L("", "", ""),
      donationBody: L("", "", ""),
      newsletterTitle: L("", "", ""),
      newsletterBody: L("", "", ""),
    },
  },
  candidate: {
    title: "Le candidat",
    permission: "content.manage",
    fields: [
      { name: "portrait", label: "Portrait officiel", type: "image" },
      { name: "role", label: "Titre / fonction", type: "l10n" },
      { name: "intro", label: "Accroche", type: "l10nText" },
      { name: "biography", label: "Biographie", type: "l10nMarkdown" },
      {
        name: "education",
        label: "Parcours académique",
        type: "list",
        itemLabel: "Diplôme",
        fields: [
          { name: "period", label: "Période", type: "text" },
          { name: "title", label: "Diplôme", type: "l10n" },
          { name: "institution", label: "Établissement", type: "text" },
        ],
      },
      {
        name: "career",
        label: "Parcours professionnel",
        type: "list",
        itemLabel: "Poste",
        fields: [
          { name: "period", label: "Période", type: "text" },
          { name: "title", label: "Fonction", type: "l10n" },
          { name: "organization", label: "Organisation", type: "text" },
        ],
      },
      {
        name: "publicService",
        label: "Expérience publique",
        type: "list",
        itemLabel: "Mandat / fonction",
        fields: [
          { name: "period", label: "Période", type: "text" },
          { name: "title", label: "Fonction", type: "l10n" },
          { name: "organization", label: "Institution", type: "text" },
        ],
      },
      {
        name: "commitments",
        label: "Engagements",
        type: "list",
        itemLabel: "Engagement",
        fields: [{ name: "text", label: "Engagement", type: "l10n" }],
      },
      {
        name: "achievements",
        label: "Réalisations vérifiables (indiquer une source)",
        type: "list",
        itemLabel: "Réalisation",
        fields: [
          { name: "year", label: "Année", type: "text" },
          { name: "title", label: "Titre", type: "l10n" },
          { name: "text", label: "Description", type: "l10nText" },
          { name: "sourceUrl", label: "Lien vers la source", type: "url" },
        ],
      },
      { name: "personalMessage", label: "Message personnel", type: "l10nMarkdown" },
    ] as Field[],
    defaults: {
      portrait: "",
      role: L("", "", ""),
      intro: L("", "", ""),
      biography: L("", "", ""),
      education: [] as { period: string; title: ReturnType<typeof L>; institution: string }[],
      career: [] as { period: string; title: ReturnType<typeof L>; organization: string }[],
      publicService: [] as { period: string; title: ReturnType<typeof L>; organization: string }[],
      commitments: [] as { text: ReturnType<typeof L> }[],
      achievements: [] as { year: string; title: ReturnType<typeof L>; text: ReturnType<typeof L>; sourceUrl: string }[],
      personalMessage: L("", "", ""),
    },
  },
  contact: {
    title: "Coordonnées & réseaux sociaux",
    permission: "settings.manage",
    fields: [
      { name: "email", label: "E-mail officiel", type: "email" },
      { name: "phone", label: "Téléphone", type: "text" },
      { name: "whatsapp", label: "WhatsApp (format international, ex. 50937000000)", type: "text" },
      { name: "address", label: "Adresse du QG", type: "textarea" },
      { name: "hours", label: "Horaires", type: "l10n" },
      { name: "notifyEmail", label: "E-mail recevant les notifications de formulaires (non public)", type: "email" },
      { name: "facebook", label: "Facebook (URL)", type: "url" },
      { name: "instagram", label: "Instagram (URL)", type: "url" },
      { name: "x", label: "X / Twitter (URL)", type: "url" },
      { name: "youtube", label: "YouTube (URL)", type: "url" },
      { name: "tiktok", label: "TikTok (URL)", type: "url" },
      { name: "linkedin", label: "LinkedIn (URL)", type: "url" },
    ] as Field[],
    defaults: {
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      hours: L("", "", ""),
      notifyEmail: "",
      facebook: "",
      instagram: "",
      x: "",
      youtube: "",
      tiktok: "",
      linkedin: "",
    },
  },
  navigation: {
    title: "Menu de navigation",
    permission: "settings.manage",
    fields: [
      {
        name: "items",
        label: "Éléments du menu (l'ordre est respecté)",
        type: "list",
        itemLabel: "Lien",
        fields: [
          {
            name: "key",
            label: "Page",
            type: "select",
            options: [
              { value: "home", label: "Accueil" },
              { value: "candidate", label: "Le candidat" },
              { value: "vision", label: "Notre vision" },
              { value: "program", label: "Programme" },
              { value: "news", label: "Actualités" },
              { value: "agenda", label: "Agenda" },
              { value: "gallery", label: "Galerie" },
              { value: "contact", label: "Contact" },
              { value: "custom", label: "Lien personnalisé" },
            ],
          },
          { name: "label", label: "Libellé personnalisé (laisser vide = libellé par défaut)", type: "l10n" },
          { name: "href", label: "URL (lien personnalisé uniquement)", type: "url" },
          { name: "visible", label: "Visible", type: "boolean" },
        ],
      },
    ] as Field[],
    defaults: {
      items: ["home", "candidate", "vision", "program", "news", "agenda", "gallery", "contact"].map((key) => ({
        key,
        label: L(""),
        href: "",
        visible: true,
      })),
    },
  },
  seo: {
    title: "Référencement (SEO)",
    permission: "settings.manage",
    fields: [
      { name: "title", label: "Titre par défaut", type: "l10n" },
      { name: "description", label: "Description", type: "l10nText" },
      { name: "keywords", label: "Mots-clés (séparés par des virgules)", type: "text" },
      { name: "ogImage", label: "Image de partage (1200×630)", type: "image" },
      { name: "indexable", label: "Autoriser l'indexation par les moteurs de recherche", type: "boolean" },
    ] as Field[],
    defaults: {
      title: L("Site officiel de campagne", "Sit ofisyèl kanpay la", "Official campaign website"),
      description: L(
        "Programme, actualités, agenda et soutien à la campagne.",
        "Pwogram, nouvèl, ajanda ak sipò pou kanpay la.",
        "Platform, news, events and campaign support.",
      ),
      keywords: "élection, Haïti, programme, campagne",
      ogImage: "",
      indexable: false,
    },
  },
  legal: {
    title: "Mentions légales & confidentialité",
    permission: "settings.manage",
    fields: [
      { name: "mentions", label: "Mentions légales", type: "l10nMarkdown" },
      { name: "privacy", label: "Politique de confidentialité", type: "l10nMarkdown" },
      { name: "terms", label: "Conditions de contribution", type: "l10nMarkdown" },
      { name: "termsVersion", label: "Version des conditions (à changer à chaque modification)", type: "text" },
    ] as Field[],
    defaults: {
      mentions: L("", "", ""),
      privacy: L(
        "## Données collectées\n\nNous ne collectons que les données strictement nécessaires : formulaires de contact, de bénévolat, d'inscription aux événements, newsletter et contributions.\n\n## Finalités\n\nTraitement des demandes, organisation de la campagne, gestion et déclaration des contributions conformément à la loi.\n\n## Paiements\n\nLes données de carte bancaire sont traitées exclusivement par nos prestataires de paiement. La campagne ne stocke jamais de numéro de carte.\n\n## Vos droits\n\nVous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à l'adresse de contact officielle.\n\n## Mesure d'audience\n\nLe site mesure sa fréquentation de manière anonyme, sans cookie publicitaire. Le signal « Do Not Track » de votre navigateur est respecté.",
        "",
        "",
      ),
      terms: L("", "", ""),
      termsVersion: "",
    },
  },
  donations: {
    title: "Paramètres des dons",
    permission: "donations.settings",
    fields: [
      { name: "enabled", label: "Ouvrir les dons en ligne (nécessite la conformité validée)", type: "boolean" },
      { name: "presetAmounts", label: "Montants proposés (HTG, un par ligne)", type: "stringList" },
      { name: "minAmount", label: "Montant minimum (HTG)", type: "number", min: 1 },
      { name: "maxAmount", label: "Plafond par contribution (HTG)", type: "number", min: 1 },
      { name: "maxPerDonor", label: "Plafond cumulé par donateur (HTG, 0 = aucun)", type: "number", min: 0 },
      { name: "allowedCountries", label: "Pays de résidence autorisés (codes ISO, ex. HT, US — vide = tous)", type: "stringList" },
      {
        name: "attestations",
        label: "Déclarations exigées du donateur",
        type: "list",
        itemLabel: "Déclaration",
        fields: [
          { name: "id", label: "Identifiant technique (ex. nationalite)", type: "text" },
          { name: "text", label: "Texte", type: "l10nText" },
        ],
      },
      { name: "cardEnabled", label: "Activer la carte bancaire (Visa / Mastercard)", type: "boolean" },
      { name: "moncashEnabled", label: "Activer MonCash", type: "boolean" },
      { name: "bankEnabled", label: "Activer le virement bancaire", type: "boolean" },
      { name: "bankName", label: "Banque", type: "text" },
      { name: "bankAccountName", label: "Titulaire du compte", type: "text" },
      { name: "bankAccountNumber", label: "Numéro de compte", type: "text" },
      { name: "bankSwift", label: "Code SWIFT / BIC", type: "text" },
      { name: "bankInstructions", label: "Instructions complémentaires", type: "l10nText" },
      {
        name: "usageCategories",
        label: "Catégories d'utilisation des contributions (sans chiffres inventés)",
        type: "list",
        itemLabel: "Catégorie",
        fields: [
          { name: "title", label: "Titre", type: "l10n" },
          { name: "text", label: "Description", type: "l10nText" },
        ],
      },
    ] as Field[],
    defaults: {
      enabled: false,
      presetAmounts: ["250", "500", "1000", "2500", "5000", "10000"],
      minAmount: 100,
      maxAmount: 100000,
      maxPerDonor: 0,
      allowedCountries: [] as string[],
      attestations: [
        {
          id: "nationalite",
          text: L(
            "Je certifie être de nationalité haïtienne ou autorisé(e) par la loi à contribuer au financement de cette campagne.",
            "Mwen sètifye mwen se Ayisyen oswa lalwa otorize m kontribye nan finansman kanpay sa a.",
            "I certify that I am a Haitian national or otherwise legally permitted to contribute to this campaign.",
          ),
        },
        {
          id: "fonds-propres",
          text: L(
            "Je certifie que cette contribution provient de mes fonds personnels et n'est pas versée pour le compte d'un tiers ou d'une personne morale.",
            "Mwen sètifye kòb sa a se pa m, epi mwen pa bay li pou lòt moun oswa pou yon antrepriz.",
            "I certify that this contribution comes from my own funds and is not made on behalf of a third party or legal entity.",
          ),
        },
      ],
      cardEnabled: false,
      moncashEnabled: false,
      bankEnabled: false,
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankSwift: "",
      bankInstructions: L("", "", ""),
      usageCategories: [] as { title: ReturnType<typeof L>; text: ReturnType<typeof L> }[],
    },
  },
  compliance: {
    title: "Conformité réglementaire des dons",
    permission: "donations.compliance",
    fields: [
      { name: "financingRules", label: "Règles de financement politique applicables vérifiées", type: "boolean" },
      { name: "contributionCaps", label: "Plafonds de contribution vérifiés et configurés", type: "boolean" },
      { name: "donorCategories", label: "Catégories de donateurs autorisées vérifiées", type: "boolean" },
      { name: "reportingObligations", label: "Obligations de déclaration identifiées et organisées", type: "boolean" },
      { name: "foreignContributions", label: "Restrictions relatives aux contributions étrangères appliquées", type: "boolean" },
      { name: "dataProtection", label: "Règles de protection des données respectées", type: "boolean" },
      { name: "legalDocuments", label: "Mentions légales, confidentialité et conditions de contribution validées", type: "boolean" },
      { name: "cardValidated", label: "Prestataire carte bancaire : conformité validée", type: "boolean" },
      { name: "moncashValidated", label: "MonCash : contrat marchand et conformité validés", type: "boolean" },
      { name: "bankValidated", label: "Virement bancaire : compte de campagne conforme validé", type: "boolean" },
      { name: "validatedBy", label: "Validé par (nom et qualité du conseil / responsable)", type: "text" },
      { name: "notes", label: "Notes et références des textes applicables", type: "textarea" },
    ] as Field[],
    defaults: {
      financingRules: false,
      contributionCaps: false,
      donorCategories: false,
      reportingObligations: false,
      foreignContributions: false,
      dataProtection: false,
      legalDocuments: false,
      cardValidated: false,
      moncashValidated: false,
      bankValidated: false,
      validatedBy: "",
      notes: "",
    },
  },
} as const satisfies Record<string, { title: string; permission: string; fields: Field[]; defaults: Record<string, unknown> }>;

export type SectionKey = keyof typeof SECTIONS;
type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T extends readonly (infer U)[] ? Widen<U>[] : T extends object ? { -readonly [K in keyof T]: Widen<T[K]> } : T;
export type SectionValue<K extends SectionKey> = Widen<(typeof SECTIONS)[K]["defaults"]>;

export const COMPLIANCE_GLOBAL_KEYS = [
  "financingRules",
  "contributionCaps",
  "donorCategories",
  "reportingObligations",
  "foreignContributions",
  "dataProtection",
  "legalDocuments",
] as const;
