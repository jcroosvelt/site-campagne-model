/**
 * Données initiales : titres des 11 thématiques du programme et catégories d'actualités.
 * Aucun contenu fictif, aucune donnée financière. Idempotent : peut être relancé sans dupliquer.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { demoCategories, demoThemes } from "../src/lib/demo-content";

const prisma = new PrismaClient();

async function main() {
  for (const { id: _id, createdAt: _c, updatedAt: _u, ...theme } of demoThemes()) {
    await prisma.programTheme.upsert({ where: { slug: theme.slug }, update: {}, create: theme as never });
  }
  for (const { id: _id, ...cat } of demoCategories()) {
    await prisma.articleCategory.upsert({ where: { slug: cat.slug }, update: {}, create: cat as never });
  }

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
