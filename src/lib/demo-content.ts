/**
 * Contenus initiaux (programme, catégories, exemples) — source unique utilisée :
 *  - par prisma/seed.ts pour remplir la base ;
 *  - par le site lorsque aucune base de données n'est encore configurée (affichage complet du site).
 */
import type { Article, ArticleCategory, Event, ProgramTheme } from "@prisma/client";

const P = "[À COMPLÉTER] ";
const L = (fr: string, ht: string, en: string) => ({ fr, ht, en });
const EPOCH = new Date("2026-11-01T12:00:00Z");

const THEME_DEFS: [string, string, [string, string, string]][] = [
  ["education", "education", ["Éducation", "Edikasyon", "Education"]],
  ["sante", "health", ["Santé", "Sante", "Health"]],
  ["economie", "economy", ["Économie", "Ekonomi", "Economy"]],
  ["emploi", "employment", ["Emploi", "Travay", "Employment"]],
  ["securite", "security", ["Sécurité", "Sekirite", "Security"]],
  ["agriculture", "agriculture", ["Agriculture", "Agrikilti", "Agriculture"]],
  ["infrastructures", "infrastructure", ["Infrastructures", "Enfrastrikti", "Infrastructure"]],
  ["environnement", "environment", ["Environnement", "Anviwònman", "Environment"]],
  ["justice", "justice", ["Justice", "Jistis", "Justice"]],
  ["jeunesse", "youth", ["Jeunesse", "Jenès", "Youth"]],
  ["culture", "culture", ["Culture", "Kilti", "Culture"]],
];

export function demoThemes(): ProgramTheme[] {
  return THEME_DEFS.map(([slug, icon, [fr, ht, en]], i) => ({
    id: `demo-theme-${slug}`,
    slug,
    icon,
    order: i + 1,
    title: L(fr, ht, en),
    summary: L(
      `${P}Résumé des propositions en matière de ${fr.toLowerCase()}.`,
      `${P}Rezime pwopozisyon yo sou ${ht.toLowerCase()}.`,
      `${P}Summary of the ${en.toLowerCase()} proposals.`,
    ),
    body: L(
      `${P}Présentez ici le diagnostic, les objectifs et la méthode pour la thématique « ${fr} ».\n\n## Constat\n\nDécrire la situation à partir de sources vérifiables.\n\n## Nos objectifs\n\nObjectifs mesurables sur la durée du mandat.\n\n## Financement\n\nPréciser les sources de financement envisagées.`,
      `${P}Prezante dyagnostik, objektif ak metòd pou tèm « ${ht} » an.`,
      `${P}Present the diagnosis, objectives and approach for « ${en} ».`,
    ),
    measures: { fr: [`${P}Mesure n°1`, `${P}Mesure n°2`, `${P}Mesure n°3`], ht: [], en: [] },
    image: null,
    published: true,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export function demoCategories(): ArticleCategory[] {
  return [
    { id: "demo-cat-communiques", slug: "communiques", name: L("Communiqués", "Kominike", "Press releases"), order: 0 },
    { id: "demo-cat-terrain", slug: "terrain", name: L("Sur le terrain", "Sou teren", "On the ground"), order: 1 },
    { id: "demo-cat-propositions", slug: "propositions", name: L("Propositions", "Pwopozisyon", "Proposals"), order: 2 },
  ];
}

export function demoArticles(): (Article & { category: ArticleCategory | null })[] {
  const cats = demoCategories();
  const base = {
    coverImage: null, coverAlt: null, videoUrl: null, featured: false, authorId: null, seoTitle: null, seoDescription: null,
    createdAt: EPOCH, updatedAt: EPOCH,
  };
  return [
    {
      ...base,
      id: "demo-article-lancement",
      slug: "exemple-lancement-de-la-campagne",
      status: "PUBLISHED",
      publishedAt: EPOCH,
      categoryId: cats[0]!.id,
      category: cats[0]!,
      title: L("[EXEMPLE] Lancement officiel de la campagne", "[EGZANP] Lansman ofisyèl kanpay la", "[EXAMPLE] Official campaign launch"),
      excerpt: L(
        "Article d'exemple destiné à illustrer la mise en page. À supprimer ou remplacer depuis l'administration.",
        "Atik egzanp pou montre jan paj la ye. Pou efase oswa ranplase.",
        "Sample article illustrating the layout. Delete or replace it from the admin panel.",
      ),
      body: L(
        "Ceci est un **article d'exemple**. Il ne relate aucun fait réel.\n\nUtilisez l'espace **Administration → Actualités** pour publier vos communiqués, comptes rendus et prises de position, avec images, vidéos et programmation de la date de publication.",
        "Sa a se yon **atik egzanp**. Li pa rakonte okenn fè reyèl.",
        "This is a **sample article**. It does not report any real event.",
      ),
    },
  ];
}

/** Événements d'exemple placés dans le futur par rapport à `now`. */
export function demoEvents(now = new Date()): Event[] {
  const inDays = (d: number, h: number) => {
    const x = new Date(now);
    x.setUTCDate(x.getUTCDate() + d);
    x.setUTCHours(h + 5, 0, 0, 0); // heure d'Haïti ≈ UTC-5
    return x;
  };
  const base = { address: null, image: null, published: true, createdAt: EPOCH, updatedAt: EPOCH, venue: "[À COMPLÉTER] Lieu" };
  return [
    {
      ...base,
      id: "demo-event-rencontre",
      slug: "exemple-rencontre-citoyenne",
      type: "MEETING",
      title: L("[EXEMPLE] Rencontre citoyenne", "[EGZANP] Rankont sitwayen", "[EXAMPLE] Town hall meeting"),
      description: L("Événement d'exemple — à remplacer par un rendez-vous réel depuis l'administration.", "Aktivite egzanp.", "Sample event."),
      startsAt: inDays(14, 15),
      endsAt: inDays(14, 18),
      city: "Port-au-Prince",
      registrationEnabled: true,
      capacity: 200,
    },
    {
      ...base,
      id: "demo-event-conference",
      slug: "exemple-conference-de-presse",
      type: "CONFERENCE",
      title: L("[EXEMPLE] Conférence de presse", "[EGZANP] Konferans pou laprès", "[EXAMPLE] Press conference"),
      description: L("Événement d'exemple.", "Aktivite egzanp.", "Sample event."),
      startsAt: inDays(21, 10),
      endsAt: null,
      city: "Cap-Haïtien",
      registrationEnabled: false,
      capacity: null,
    },
  ];
}
