# Plateforme web de campagne électorale

Site institutionnel et électoral complet : site public multilingue (français, créole haïtien, anglais), page de dons sécurisée, back-office avec rôles, gestion des contributions et journal d'audit.

> **État :** application fonctionnelle, prête pour la mise en production **après** configuration (contenus, prestataires de paiement, SMTP) et **validation réglementaire** des dons. Les contenus fournis sont provisoires et signalés par `[À COMPLÉTER]` ou `[EXEMPLE]`.

---

## 1. Architecture

| Couche | Choix |
|---|---|
| Framework | **Next.js 15** (App Router, React Server Components, Server Actions), **TypeScript** strict |
| Interface | **Tailwind CSS 4** (charte dans `src/app/globals.css`), Radix UI (dialogues accessibles), Lucide (icônes), polices auto-hébergées (Source Serif 4, Inter) |
| Données | **PostgreSQL** via **Prisma** (requêtes paramétrées) — compatible Supabase, Neon, RDS, PostgreSQL auto-hébergé |
| Authentification | Sessions serveur (jeton aléatoire, haché en SHA-256 en base, cookie `HttpOnly`/`Secure`/`SameSite=Lax`, 8 h), mots de passe bcrypt (coût 12) |
| Paiements | Couche d'abstraction `PaymentProvider` : **Stripe Checkout** (Visa/Mastercard), **MonCash** (API marchande Digicel), **virement bancaire** |
| Fichiers | Stockage local (`public/uploads`) ou **Supabase Storage** |
| E-mail | SMTP (Nodemailer) ; journalisation en console si non configuré |
| PDF | `pdf-lib` (reçus, programme généré) |

```
├── prisma/
│   ├── schema.prisma          # modèle de données (17 tables)
│   ├── migrations/            # migrations SQL versionnées
│   └── seed.ts                # programme (11 thèmes) + contenus d'exemple
├── scripts/create-admin.ts    # création du super administrateur
├── src/
│   ├── app/
│   │   ├── (site)/            # site public : accueil, candidat, vision, programme, actualités,
│   │   │                      # agenda, galerie, contact, rejoindre, faire-un-don, transparence, pages légales
│   │   ├── admin/             # back-office (/admin) + actions serveur sécurisées
│   │   ├── actions/public.ts  # formulaires publics (contact, bénévolat, newsletter, inscriptions, dons)
│   │   └── api/               # webhooks paiement, reçus, exports CSV, upload, mesure d'audience, santé
│   ├── components/            # ui/ (primitives), site/ (public), forms/, admin/
│   ├── lib/
│   │   ├── payments/          # stripe.ts, moncash.ts, bank.ts, index.ts (conditions d'activation)
│   │   ├── donations.ts       # cycle de vie des dons, confirmation, reçus, statistiques
│   │   ├── donation-status.ts # machine à états
│   │   ├── settings-schema.ts # paramètres administrables (descripteurs → formulaires + validation zod)
│   │   ├── auth.ts, permissions.ts, rate-limit.ts, audit.ts, antispam.ts
│   │   └── i18n*.ts           # langues
│   ├── messages/{fr,ht,en}.ts # traductions de l'interface
│   └── middleware.ts          # CSP avec nonce, protection /admin, ?lang=
└── tests/                     # Vitest (unitaires + intégration PostgreSQL)
```

### Principes
- **Tout contenu est administrable** : textes d'accueil, candidat, programme, menu, contact, SEO, mentions légales, montants de dons… Les paramètres sont décrits une seule fois (`settings-schema.ts`) ; le même descripteur génère le formulaire d'administration **et** la validation côté serveur.
- **Contenus multilingues** stockés en JSON `{ fr, ht, en }` ; repli automatique sur le français si une traduction manque.
- **Aucune donnée inventée** : statistiques calculées en base ; montants financiers calculés **exclusivement** sur les dons `CONFIRMED`.

## 2. Installation (développement)

Prérequis : Node.js ≥ 20, PostgreSQL ≥ 14 (ou `docker compose up db`).

```bash
npm install
cp .env.example .env              # puis renseigner DATABASE_URL et APP_SECRET (openssl rand -hex 32)
npx prisma migrate deploy         # crée les tables
npm run db:seed                   # programme + contenus d'exemple
ADMIN_EMAIL=vous@exemple.ht ADMIN_PASSWORD='UnMotDePasseSolide2026' npm run admin:create
npm run dev                       # http://localhost:3000 — back-office : /admin
```

Commandes utiles : `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run db:studio`.

## 3. Déploiement

### Option A — Docker (VPS, serveur de la campagne)
```bash
docker compose up -d --build      # PostgreSQL + application ; migrations appliquées au démarrage
# puis, depuis un poste ayant accès à la base (DATABASE_URL) :
npm run db:seed
ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create
```
Placer l'application derrière un reverse proxy HTTPS (Caddy, Nginx + Let's Encrypt). Le `X-Forwarded-For` doit être transmis (limitation de débit, journal d'audit).

### Option B — Vercel / plateforme serverless + Supabase
1. Créer un projet Supabase ; utiliser la chaîne de connexion **pooler** pour `DATABASE_URL`.
2. Créer un bucket **public** (ex. `public-media`) et définir `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (variable serveur uniquement). Le stockage local n'est **pas** persistant en serverless.
3. Définir toutes les variables de `.env.example` dans la plateforme ; build : `npm run build` ; lancer `npx prisma migrate deploy` lors de chaque déploiement.

### Avant l'ouverture au public
- [ ] Remplacer tous les contenus `[À COMPLÉTER]` / `[EXEMPLE]` (Administration → Contenus, Programme, Actualités, Agenda).
- [ ] Téléverser la photo officielle, le logo, l'image de partage.
- [ ] Renseigner les coordonnées officielles et les réseaux sociaux.
- [ ] Faire relire les traductions en créole haïtien par un locuteur natif.
- [ ] Faire valider mentions légales, politique de confidentialité et conditions de contribution par un juriste.
- [ ] Configurer le SMTP (domaine expéditeur avec SPF, DKIM, DMARC).
- [ ] Activer l'indexation (Administration → Contenus → SEO).
- [ ] Mettre en place des sauvegardes PostgreSQL automatiques (Supabase : PITR ; sinon `pg_dump` quotidien chiffré, hors site, avec test de restauration) et sauvegarder les fichiers téléversés.

## 4. Dons — fonctionnement et étapes restantes

### Garanties implémentées
- **Aucun paiement simulé.** Un don est créé `En attente` ; il ne passe à `Confirmé` que par :
  - un **webhook Stripe signé** (signature vérifiée sur le corps brut) ou une interrogation serveur de l'API Stripe ;
  - une **vérification serveur auprès de l'API MonCash** (`RetrieveTransactionPayment` / `RetrieveOrderPayment`) — la redirection du navigateur n'est jamais considérée comme une preuve ;
  - pour un virement, un **rapprochement bancaire** saisi par un responsable financier (référence + montant reçu, opération journalisée).
- Contrôle systématique **montant + devise + référence** avant confirmation ; incohérence ⇒ `Échoué` + alerte.
- Transitions atomiques et **idempotentes** (machine à états, événements de paiement dédupliqués).
- **Aucune donnée de carte** ne transite ni n'est stockée (page de paiement hébergée par Stripe).
- Numéro de référence unique (`DON-AAAA-XXXXXXXX`), page de suivi protégée par jeton secret, **reçu PDF** numéroté (`REC-AAAA-000001`) uniquement après confirmation, envoyé par e-mail et téléchargeable.
- Statuts : En attente, Confirmé, Échoué, Remboursé, Annulé.

### Verrou de conformité
Un moyen de paiement n'est proposé au public **que si toutes** ces conditions sont réunies (visible dans Administration → Dons → Paramètres) :
1. les 7 points de conformité globale validés par le **super administrateur** (règles de financement politique, plafonds, catégories de donateurs, obligations de déclaration, contributions étrangères, protection des données, documents légaux) ;
2. les dons ouverts ; 3. le moyen activé ; 4. sa conformité propre validée ; 5. ses identifiants présents dans l'environnement.

Tant que ce n'est pas le cas, la page `/faire-un-don` affiche « Les dons en ligne ne sont pas encore ouverts ».

Paramètres configurables : montants proposés, minimum, plafond par contribution, plafond cumulé par donateur, pays de résidence autorisés, déclarations exigées (nationalité, fonds propres…), coordonnées bancaires, catégories d'utilisation.

> ⚠️ Les déclarations, plafonds et textes fournis sont des **modèles** : ils doivent être adaptés au droit électoral applicable (décret électoral en vigueur, règles du CEP, etc.) par un conseil juridique. La plateforme ne se substitue pas à cette analyse.

### Carte bancaire (Stripe)
1. Vérifier l'éligibilité : Stripe exige une entité juridique dans un **pays pris en charge** ; une campagne domiciliée en Haïti peut devoir passer par une entité/un prestataire tiers autorisé. Vérifier aussi l'acceptation de la devise **HTG** et la politique de Stripe relative aux activités politiques.
2. Dans le tableau de bord Stripe, n'activer que **Cartes** comme moyen de paiement.
3. Renseigner `STRIPE_SECRET_KEY`.
4. Créer un endpoint webhook vers `https://VOTRE-DOMAINE/api/webhooks/stripe` avec les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded` ; renseigner `STRIPE_WEBHOOK_SECRET`.
5. Tester en mode test (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`), puis valider la conformité dans l'administration.

Pour un autre prestataire carte (acquéreur local, passerelle bancaire haïtienne…) : implémenter l'interface `PaymentProvider` (`src/lib/payments/types.ts`) et l'enregistrer dans `src/lib/payments/index.ts`.

### MonCash
1. Obtenir un compte **MonCash Business** et l'accès API marchande auprès de Digicel ; récupérer `client_id` / `client_secret`.
2. Dans le portail marchand, déclarer l'URL de retour `https://VOTRE-DOMAINE/api/payments/moncash/return` et, si disponible, l'URL de notification `https://VOTRE-DOMAINE/api/webhooks/moncash?key=<MONCASH_NOTIFY_KEY>` (clé longue et aléatoire).
3. Renseigner `MONCASH_CLIENT_ID`, `MONCASH_CLIENT_SECRET`, `MONCASH_NOTIFY_KEY`, tester en `MONCASH_MODE=sandbox`, puis passer en `live`.
4. Vérifier avec Digicel les éventuelles restrictions applicables aux campagnes politiques, puis valider la conformité.

### Virement bancaire
Renseigner les coordonnées du **compte officiel de campagne**. Le donateur reçoit une référence à reporter ; le responsable financier confirme après réception (montant exact exigé). Remboursements de virements : saisis manuellement avec la référence ; remboursements carte/MonCash : effectués chez le prestataire, statut mis à jour par notification.

### Transparence
La page `/transparence` présente les catégories d'utilisation (sans chiffres) et les **rapports financiers** publiés depuis Administration → Rapports financiers (PDF). Les exports CSV (détail et rapport mensuel) servent aux déclarations.

## 5. Back-office (`/admin`)

| Module | Super admin | Admin | Éditeur | Resp. financier |
|---|:-:|:-:|:-:|:-:|
| Contenus, programme, actualités, agenda, galerie | ✓ | ✓ | ✓ | — |
| Menu, contact, SEO, mentions légales | ✓ | ✓ | — | — |
| Messages, bénévoles, newsletter | ✓ | ✓ | — | — |
| Statistiques financières agrégées | ✓ | ✓ | — | ✓ |
| Données des donateurs, exports, reçus, virements | ✓ | — | — | ✓ |
| Paramètres des dons | ✓ | — | — | ✓ |
| Validation de la conformité | ✓ | — | — | — |
| Utilisateurs, rôles | ✓ | — | — | — |
| Journal d'audit | ✓ | ✓ | — | — |

Tableau de bord : visiteurs uniques (mesure anonyme sans cookie, respect de Do Not Track / GPC), actualités publiées et programmées, événements, inscriptions, contributions confirmées et montant total confirmé, état des moyens de paiement.

Actualités : catégories, image, vidéo YouTube/Vimeo, brouillon/publication/archivage, **publication programmée** (date future), SEO par article, partage. Agenda : vue liste et calendrier, inscriptions avec capacité, export CSV, ajout au calendrier (.ics). Galerie : photos/vidéos par catégorie, visionneuse plein écran au clavier et au toucher.

## 6. Sécurité

- Contrôle d'accès par rôle vérifié **côté serveur** sur chaque page, action et route API (le middleware n'est qu'un premier filtre).
- Validation **zod** de toutes les entrées ; requêtes Prisma paramétrées (pas d'injection SQL).
- XSS : rendu React échappé, Markdown sans HTML brut, liens filtrés (`javascript:` refusé), **CSP avec nonce**, `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- CSRF : Server Actions (contrôle d'origine natif de Next.js) ; routes API mutables protégées par vérification d'`Origin` ; cookies `SameSite=Lax`.
- Connexion : limitation par IP (20 / 15 min), verrouillage du compte après 5 échecs (15 min), temps de réponse constant, invalidation des sessions au changement de mot de passe ou à la désactivation.
- Anti-spam : pot de miel, horodatage signé HMAC (délai minimal), limitation de débit par formulaire et par IP.
- Téléversements : vérification de la **signature binaire** du fichier (JPEG, PNG, WebP, AVIF, PDF), 15 Mo max., noms aléatoires.
- Exports CSV protégés contre l'injection de formules ; chaque export et chaque consultation de don est journalisé.
- Secrets uniquement dans l'environnement serveur ; aucune clé secrète exposée au navigateur.
- **Journal d'audit** : connexions, échecs, verrouillages, modifications de contenus et de paramètres (détail des changements pour les dons et la conformité), opérations financières, exports.

Recommandations complémentaires : WAF/CDN (Cloudflare) devant le site, double authentification au niveau du fournisseur d'identité ou du proxy pour `/admin`, revue de sécurité indépendante avant l'ouverture des dons, rotation des secrets.

## 7. Langues

- Interface : `src/messages/fr.ts`, `ht.ts`, `en.ts` (typage strict : une clé manquante bloque la compilation).
- Contenus : saisis dans l'administration via le sélecteur « Langue d'édition » ; repli sur le français.
- Le visiteur change de langue depuis le menu (cookie) ; `?lang=ht` est aussi accepté pour partager un lien.

## 8. Tests

```bash
npm test         # 22 tests : machine à états, signature des webhooks Stripe, vérification MonCash,
                 # verrou de conformité, permissions, anti-spam, CSV, URL, fuseau horaire,
                 # + intégration PostgreSQL (confirmation idempotente concurrente, contrôle du montant, statistiques)
```
Le parcours complet (don par virement → confirmation par le responsable financier → reçu PDF, contact, changement de langue, connexion, article programmé) a été vérifié dans un navigateur réel.

## 9. Limites connues / évolutions
- Double authentification (TOTP) non intégrée nativement : recommandée via le proxy ou en évolution.
- La langue est portée par un cookie (URLs identiques dans les trois langues) ; pour un référencement multilingue avancé, prévoir des préfixes d'URL (`/en`, `/ht`).
- Envoi de campagnes newsletter : la plateforme collecte les inscriptions avec double opt-in ; l'envoi groupé se fait via un outil dédié (export CSV des abonnés confirmés depuis Administration → Messages → Newsletter).
