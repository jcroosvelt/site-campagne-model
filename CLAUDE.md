# Consignes du projet

## Déploiement — OBLIGATOIRE
Le dépôt est connecté à **Vercel**, qui déploie automatiquement la branche **`main`** en production.
À la fin de **chaque** travail sur le site — **toujours, même si la base de données n'est pas configurée** :
1. vérifier : `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` ;
2. committer sur la branche de travail et la pousser ;
3. fusionner la branche de travail dans `main` et pousser `main` (`git push origin main`) pour déclencher le déploiement ;
4. donner à l'utilisateur l'URL du site Vercel et signaler toute variable d'environnement manquante.

## Langue
Communiquer avec l'utilisateur en **français**.

## Repères
- Build Vercel : `scripts/vercel-build.mjs` (migrations + seed si `DATABASE_URL` est défini).
- Sans `DATABASE_URL`, le site public s'affiche entièrement avec les contenus par défaut (`src/lib/demo-content.ts`) ;
  formulaires et administration nécessitent la base. Ne jamais casser ce mode : tester avec `env -u DATABASE_URL npm run vercel-build`.
- Variables d'environnement : voir `.env.example` ; détails dans `README.md` (section Déploiement).
