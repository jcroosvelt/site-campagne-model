/**
 * Build Vercel : prépare la base (migrations + données initiales + compte admin) si DATABASE_URL
 * est défini, puis compile le site. Sans base configurée, le site est quand même compilé et
 * déployé : les pages publiques s'affichent avec les contenus par défaut (src/lib/demo-content.ts).
 */
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("npx prisma generate");
if (process.env.DATABASE_URL) {
  run("npx prisma migrate deploy");
  run("npx tsx prisma/seed.ts");
} else {
  console.warn("\n⚠️  DATABASE_URL non défini : migrations ignorées. Ajoutez-le dans Vercel → Settings → Environment Variables puis redéployez.\n");
}
run("npx next build");
