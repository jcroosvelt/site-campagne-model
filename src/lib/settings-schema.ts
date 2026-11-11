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
const P = "[À COMPLÉTER] ";

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
      campaignName: "Ensemble pour Haïti",
      candidateName: "Prénom NOM",
      logoUrl: "",
      electionLabel: L(P + "Élection présidentielle", P + "Eleksyon prezidansyèl", P + "Presidential election"),
      slogan: L("Bâtir ensemble un avenir digne", "Ann bati ansanm yon avni ak diyite", "Building a dignified future together"),
      heroMessage: L(
        P + "Message principal de la campagne : une phrase forte qui résume l'ambition du candidat pour le pays.",
        P + "Mesaj prensipal kanpay la: yon fraz ki rezime anbisyon kandida a pou peyi a.",
        P + "Main campaign message: one strong sentence summarising the candidate's ambition for the country.",
      ),
      heroImage: "",
      legalEntity: P + "Comité de campagne — dénomination officielle",
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
      messageTitle: L("Servir le pays, avec vous", "Sèvi peyi a, ansanm avèk nou", "Serving the country, with you"),
      messageBody: L(
        P + "Ce texte est le message personnel du candidat aux citoyens. Il présente en quelques paragraphes les raisons de sa candidature, sa conception de l'engagement public et sa méthode.\n\nRemplacez-le depuis **Administration > Contenus > Page d'accueil**.",
        P + "Tèks sa a se mesaj pèsonèl kandida a pou sitwayen yo. Ranplase l nan espas administrasyon an.",
        P + "This is the candidate's personal message to citizens. Replace it from the admin panel.",
      ),
      messageSignature: "Prénom NOM",
      visionTitle: L("Une Haïti stable, juste et prospère", "Yon Ayiti ki estab, jis e pwospè", "A stable, fair and prosperous Haiti"),
      visionBody: L(
        P + "Résumé de la vision : le cap que le candidat propose au pays pour les cinq prochaines années.",
        P + "Rezime vizyon an: direksyon kandida a pwopoze pou peyi a pou senk ane k ap vini yo.",
        P + "Summary of the vision: the course the candidate proposes for the next five years.",
      ),
      visionPillars: [
        { title: L("Sécurité et État de droit", "Sekirite ak Eta de dwa", "Security and rule of law"), text: L(P + "Description du pilier.", P + "Deskripsyon.", P + "Pillar description.") },
        { title: L("Dignité et services essentiels", "Diyite ak sèvis esansyèl", "Dignity and essential services"), text: L(P + "Description du pilier.", P + "Deskripsyon.", P + "Pillar description.") },
        { title: L("Travail et production nationale", "Travay ak pwodiksyon nasyonal", "Work and national production"), text: L(P + "Description du pilier.", P + "Deskripsyon.", P + "Pillar description.") },
      ],
      participationTitle: L("Cette campagne est la vôtre", "Kanpay sa a se pou nou", "This campaign is yours"),
      participationBody: L(
        "Bénévoles, sympathisants, citoyens engagés : chacun peut contribuer à porter ce projet dans sa commune.",
        "Volontè, sipòtè, sitwayen angaje: chak moun ka ede pote pwojè sa a nan komin li.",
        "Volunteers, supporters, engaged citizens: everyone can help carry this project in their community.",
      ),
      donationTitle: L("Soutenez la campagne", "Sipòte kanpay la", "Support the campaign"),
      donationBody: L(
        "Les contributions volontaires des citoyens permettent de financer une campagne indépendante, transparente et proche du terrain.",
        "Kontribisyon volontè sitwayen yo pèmèt nou finanse yon kanpay endepandan, transparan e pre moun yo.",
        "Voluntary contributions from citizens fund an independent, transparent, grassroots campaign.",
      ),
      newsletterTitle: L("Restez informé(e)", "Rete enfòme", "Stay informed"),
      newsletterBody: L(
        "Recevez les nouvelles de la campagne et les dates des prochains rendez-vous.",
        "Resevwa nouvèl kanpay la ak dat pwochen randevou yo.",
        "Get campaign news and upcoming event dates.",
      ),
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
      role: L(P + "Candidat à l'élection présidentielle", P + "Kandida nan eleksyon prezidansyèl", P + "Presidential candidate"),
      intro: L(P + "Courte présentation du candidat en deux phrases.", P + "Ti prezantasyon kandida a.", P + "Short introduction of the candidate."),
      biography: L(
        P + "Biographie du candidat : origines, valeurs, étapes marquantes. Chaque fait doit pouvoir être vérifié.",
        P + "Biyografi kandida a.",
        P + "Candidate biography.",
      ),
      education: [{ period: "AAAA – AAAA", title: L(P + "Diplôme", P + "Diplòm", P + "Degree"), institution: P + "Établissement" }],
      career: [{ period: "AAAA – AAAA", title: L(P + "Fonction", P + "Fonksyon", P + "Position"), organization: P + "Organisation" }],
      publicService: [{ period: "AAAA – AAAA", title: L(P + "Mandat", P + "Manda", P + "Office"), organization: P + "Institution" }],
      commitments: [
        { text: L(P + "Engagement n°1", P + "Angajman 1", P + "Commitment 1") },
        { text: L(P + "Engagement n°2", P + "Angajman 2", P + "Commitment 2") },
      ],
      achievements: [] as { year: string; title: ReturnType<typeof L>; text: ReturnType<typeof L>; sourceUrl: string }[],
      personalMessage: L(P + "Message personnel du candidat.", P + "Mesaj pèsonèl kandida a.", P + "Personal message from the candidate."),
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
      address: P + "Adresse du quartier général de campagne",
      hours: L("Lundi – vendredi, 9 h – 17 h", "Lendi – vandredi, 9è – 5è", "Monday – Friday, 9am – 5pm"),
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
      title: L("Ensemble pour Haïti — Site officiel de campagne", "Ansanm pou Ayiti — Sit ofisyèl kanpay la", "Ensemble pour Haïti — Official campaign website"),
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
      mentions: L(
        "## Éditeur du site\n\n[À COMPLÉTER] Dénomination de l'entité responsable de la campagne, adresse, responsable de la publication, contact.\n\n## Hébergement\n\n[À COMPLÉTER] Nom et adresse de l'hébergeur.\n\n## Propriété intellectuelle\n\nLes contenus de ce site sont la propriété de la campagne, sauf mention contraire.",
        "",
        "",
      ),
      privacy: L(
        "## Données collectées\n\nNous ne collectons que les données strictement nécessaires : formulaires de contact, de bénévolat, d'inscription aux événements, newsletter et contributions.\n\n## Finalités\n\nTraitement des demandes, organisation de la campagne, gestion et déclaration des contributions conformément à la loi.\n\n## Paiements\n\nLes données de carte bancaire sont traitées exclusivement par nos prestataires de paiement certifiés. La campagne ne stocke jamais de numéro de carte.\n\n## Durée de conservation\n\n[À COMPLÉTER selon les obligations légales applicables.]\n\n## Vos droits\n\nVous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à l'adresse de contact officielle.\n\n## Mesure d'audience\n\nLe site mesure sa fréquentation de manière anonyme, sans cookie publicitaire. Le signal « Do Not Track » de votre navigateur est respecté.",
        "",
        "",
      ),
      terms: L(
        "## Conditions de contribution\n\n[À COMPLÉTER et faire valider par un conseil juridique avant l'ouverture des dons.]\n\n1. Les contributions sont volontaires et effectuées à titre personnel, avec des fonds propres.\n2. Les contributions sont soumises aux plafonds et aux règles de financement politique en vigueur.\n3. Les contributions de personnes ou d'entités non autorisées par la loi sont refusées et remboursées.\n4. Le donateur garantit l'exactitude des informations fournies.\n5. Les contributions peuvent faire l'objet d'une déclaration aux autorités compétentes conformément à la loi.\n6. Un reçu est délivré uniquement après confirmation effective du paiement.",
        "",
        "",
      ),
      termsVersion: "2026-11-01",
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
      usageCategories: [
        { title: L("Rencontres citoyennes", "Rankont sitwayen", "Town halls"), text: L("Organisation de meetings et de réunions publiques dans les communes.", "Òganize reyinyon piblik nan komin yo.", "Organising public meetings across communities.") },
        { title: L("Communication", "Kominikasyon", "Communications"), text: L("Impression de documents, diffusion du programme, présence numérique.", "Enprime dokiman, pataje pwogram nan, prezans sou entènèt.", "Printing, distributing the platform, digital presence.") },
        { title: L("Déplacements", "Deplasman", "Travel"), text: L("Visites de terrain dans les dix départements.", "Vizit sou teren nan dis depatman yo.", "Field visits across the ten departments.") },
        { title: L("Logistique et observation", "Lojistik ak obsèvasyon", "Logistics and observation"), text: L("Matériel, formation des bénévoles et des observateurs électoraux.", "Materyèl, fòmasyon volontè ak obsèvatè.", "Equipment, volunteer and observer training.") },
      ],
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
