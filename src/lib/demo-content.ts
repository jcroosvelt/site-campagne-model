/**
 * Contenus initiaux (titres des thématiques du programme, catégories d'actualités) — source unique utilisée :
 *  - par prisma/seed.ts pour remplir la base ;
 *  - par le site lorsque aucune base de données n'est encore configurée (affichage complet du site).
 */
import type { Article, ArticleCategory, Event, ProgramTheme } from "@prisma/client";

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
    summary: L("", "", ""),
    body: L("", "", ""),
    measures: { fr: [], ht: [], en: [] },
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
  return [];
}

export function demoEvents(_now = new Date()): Event[] {
  return [];
}
