/**
 * Données initiales : structure du programme (11 thématiques) et contenus d'EXEMPLE clairement identifiés.
 * Aucune donnée financière n'est créée. Idempotent : peut être relancé sans dupliquer.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const P = "[À COMPLÉTER] ";
const L = (fr: string, ht: string, en: string) => ({ fr, ht, en });

const THEMES: [string, string, [string, string, string]][] = [
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

async function main() {
  for (const [i, [slug, icon, [fr, ht, en]]] of THEMES.entries()) {
    await prisma.programTheme.upsert({
      where: { slug },
      update: {},
      create: {
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
      },
    });
  }

  const cats = [
    ["communiques", L("Communiqués", "Kominike", "Press releases")],
    ["terrain", L("Sur le terrain", "Sou teren", "On the ground")],
    ["propositions", L("Propositions", "Pwopozisyon", "Proposals")],
  ] as const;
  for (const [i, [slug, name]] of cats.entries()) {
    await prisma.articleCategory.upsert({ where: { slug }, update: {}, create: { slug, name, order: i } });
  }
  const terrain = await prisma.articleCategory.findUniqueOrThrow({ where: { slug: "terrain" } });
  const communiques = await prisma.articleCategory.findUniqueOrThrow({ where: { slug: "communiques" } });

  await prisma.article.upsert({
    where: { slug: "exemple-lancement-de-la-campagne" },
    update: {},
    create: {
      slug: "exemple-lancement-de-la-campagne",
      status: "PUBLISHED",
      publishedAt: new Date(),
      categoryId: communiques.id,
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
  });
  await prisma.article.upsert({
    where: { slug: "exemple-compte-rendu-de-terrain" },
    update: {},
    create: {
      slug: "exemple-compte-rendu-de-terrain",
      status: "DRAFT",
      categoryId: terrain.id,
      title: L("[EXEMPLE] Compte rendu de visite (brouillon)", "[EGZANP] Rapò vizit (bouyon)", "[EXAMPLE] Visit report (draft)"),
      excerpt: L("Brouillon d'exemple, non visible sur le site.", "Bouyon egzanp.", "Sample draft, not public."),
      body: L("Brouillon.", "Bouyon.", "Draft."),
    },
  });

  const inDays = (d: number, h: number) => {
    const x = new Date();
    x.setUTCDate(x.getUTCDate() + d);
    x.setUTCHours(h + 5, 0, 0, 0); // heure d'Haïti ≈ UTC-5
    return x;
  };
  await prisma.event.upsert({
    where: { slug: "exemple-rencontre-citoyenne" },
    update: {},
    create: {
      slug: "exemple-rencontre-citoyenne",
      type: "MEETING",
      title: L("[EXEMPLE] Rencontre citoyenne", "[EGZANP] Rankont sitwayen", "[EXAMPLE] Town hall meeting"),
      description: L("Événement d'exemple — à remplacer par un rendez-vous réel depuis l'administration.", "Aktivite egzanp.", "Sample event."),
      startsAt: inDays(14, 15),
      endsAt: inDays(14, 18),
      venue: "[À COMPLÉTER] Lieu",
      city: "Port-au-Prince",
      registrationEnabled: true,
      capacity: 200,
    },
  });
  await prisma.event.upsert({
    where: { slug: "exemple-conference-de-presse" },
    update: {},
    create: {
      slug: "exemple-conference-de-presse",
      type: "CONFERENCE",
      title: L("[EXEMPLE] Conférence de presse", "[EGZANP] Konferans pou laprès", "[EXAMPLE] Press conference"),
      description: L("Événement d'exemple.", "Aktivite egzanp.", "Sample event."),
      startsAt: inDays(21, 10),
      venue: "[À COMPLÉTER] Lieu",
      city: "Cap-Haïtien",
    },
  });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && !(await prisma.user.findUnique({ where: { email } }))) {
    await prisma.user.create({
      data: { email, name: process.env.ADMIN_NAME || "Super administrateur", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Super administrateur créé : ${email}`);
  }
  console.log("Données initiales en place.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
