# ◐ Avancement

Mon gestionnaire de projets perso : évals, projets perso, prépa CUEC, recherche de stage.

- ✨ **Projet magique** : un cours (texte, PDF, photo) ou un lien de conversation Claude → Claude crée le projet,
  découpe les révisions et les place automatiquement dans les trous de l'emploi du temps.
- 🪄 **Planificateur** : répartit les tâches restantes avant l'échéance, sans toucher aux cours (ICS), en étalant la charge.
- 📅 **Calendrier** semaine / mois / jour : cours en gris, créneaux en couleur, glisser-déposer pour décaler.
- ⏰ **Rattrapage** : les créneaux passés non validés sont replacés en un clic.
- 📓 **Journal automatique** : chaque tâche cochée et chaque créneau « fait » s'y ajoute.
- 📁 Dossier du Mac (Finder / VS Code) et 🐙 repo GitHub liés à chaque projet, avec les derniers commits.

**Stack** : Next.js 15 (App Router) · Tailwind CSS 4 · Supabase (Postgres + Auth) · Vercel.

## Mise en route

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute `supabase/migrations/0001_init.sql` puis `0002_v2.sql`.
3. Dans **Authentication → URL Configuration**, ajoute `http://localhost:3000/auth/callback`
   (et plus tard l'URL Vercel) dans les *Redirect URLs*.
4. Copie `.env.example` vers `.env.local` et remplis l'URL et la clé `anon` (Settings → API).
5. Lance l'app :
   ```bash
   npm install
   npm run dev
   ```
6. Ouvre http://localhost:3000, connecte-toi avec le lien magique reçu par mail.

## Déploiement

Importe le repo sur [vercel.com](https://vercel.com), ajoute les deux variables d'environnement, déploie.
Pense à ajouter `https://<ton-app>.vercel.app/auth/callback` dans les Redirect URLs Supabase.

## Variables d'environnement (Vercel)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | clé publishable / anon |
| `ANTHROPIC_API_KEY` | pour ✨ | active le projet magique (console.anthropic.com) |
| `GITHUB_TOKEN` | non | voir aussi les repos privés et leurs commits |

## Helper macOS (Finder)

Un navigateur ne peut pas ouvrir le Finder. Le script `public/install-helper-macos.sh` installe une mini app
AppleScript qui gère les liens `avancement://` (ouvrir un dossier, choisir un dossier). La commande exacte est dans Réglages.

## Les pages

| Page | Ce qu'on y fait |
|---|---|
| `/` | Aujourd'hui, en retard, stats de la semaine, projets en cours |
| `/projets/[id]` | Tâches, planification auto, prochains créneaux, Finder / VS Code / GitHub |
| `/calendrier` | Cours + créneaux, glisser-déposer |
| `/journal` | « J'ai fait ça à tel moment », groupé par jour |
| `/reglages` | Lien ICS, pseudo GitHub, horaires de travail, helper macOS |

## Pipeline « mon cours → mes tâches »

Voir [`docs/pipeline-claude.md`](docs/pipeline-claude.md).
