/**
 * Crée (ou réinitialise) un compte super administrateur.
 * Usage : ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME || "Super administrateur";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_EMAIL manquant ou invalide");
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("ADMIN_PASSWORD : 12 caractères minimum, avec majuscules, minuscules et chiffres");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN", active: true, failedLogins: 0, lockedUntil: null },
    create: { email, name, passwordHash, role: "SUPER_ADMIN" },
  });
  await prisma.session.deleteMany({ where: { user: { email } } });
  console.log(`Super administrateur prêt : ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
