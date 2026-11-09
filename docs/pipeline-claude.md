# Pipeline : envoyer un cours à Claude → tâches de révision créées automatiquement

## Principe

Claude (dans Claude Desktop ou claude.ai) est connecté à ta base Supabase via le
**connecteur MCP Supabase**. Tu lui donnes ton cours (PDF, photos, notes) et il écrit
directement les tâches dans la table `tasks`, marquées `source = 'claude'` (elles
apparaissent avec ✨ dans l'app). Aucune clé API à payer : ça passe par ton abonnement Claude.

## Installation (une seule fois)

1. Dans Claude : **Paramètres → Connecteurs → Ajouter** → *Supabase*, puis connecte ton compte.
2. Vérifie que Claude voit ton projet : demande-lui « liste les tables de mon projet Supabase ».

> ⚠️ Le connecteur agit avec les droits d'admin (pas de RLS) : `auth.uid()` y vaut `null`.
> Il faut donc toujours remplir `user_id` à la main, ce que fait le prompt ci-dessous.

## Le prompt à utiliser

Copie-colle ce prompt avec ton cours en pièce jointe :

```text
Voici mon cours pour l'éval « <NOM DU PROJET> » qui a lieu le <DATE>.

1. Lis le cours et découpe-le en tâches de révision concrètes (30 à 90 min chacune) :
   relire une notion, refaire un exercice, faire une fiche, faire un sujet blanc...
2. Répartis-les entre aujourd'hui et la veille de l'éval (colonne due_date).
3. Dans mon projet Supabase :
   - s'il n'existe pas encore, crée le projet dans `projects`
     (category = 'eval', deadline = la date de l'éval) en reprenant le user_id
     d'un projet existant ;
   - insère les tâches dans `tasks` avec project_id, title, details (ce qu'il faut
     faire précisément), due_date, estimated_minutes, source = 'claude',
     et user_id = (select user_id from projects where id = <project_id>).
4. Résume-moi ce que tu as créé.
```

Variante pour la prépa CUEC : remplace l'éval par « prépa CUEC CentraleSupélec »,
donne le programme ou une annale, et demande un plan d'entraînement sur plusieurs semaines.
