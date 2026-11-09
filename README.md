# ◐ Avancement

Mon gestionnaire de projets perso : évals, projets perso, prépa CUEC, recherche de stage.
Tâches à cocher, liens vers les dossiers du PC et GitHub, emploi du temps IUT (ICS),
créneaux de travail déplaçables, journal, et création de tâches par Claude à partir d'un cours.

**Stack** : Next.js 15 (App Router) · Tailwind CSS 4 · Supabase (Postgres + Auth) · Vercel.

## Mise en route

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, colle le contenu de `supabase/migrations/0001_init.sql` et clique sur **Run**.
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

## Les pages

| Page | Ce qu'on y fait |
|---|---|
| `/` | Tous les projets en cours, avec leur avancement |
| `/projets/[id]` | Les tâches à cocher, le lien vers le dossier (s'ouvre dans VS Code) et vers GitHub |
| `/agenda` | Les cours de l'IUT (ICS), les créneaux de travail (fait / décaler / annuler) et les trous libres |
| `/journal` | « J'ai fait ça à tel moment » |

## Pipeline « mon cours → mes tâches »

Voir [`docs/pipeline-claude.md`](docs/pipeline-claude.md).
