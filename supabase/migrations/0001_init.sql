-- Schéma du gestionnaire d'avancement
-- À coller dans Supabase > SQL Editor, puis "Run".

create type project_category as enum ('eval', 'perso', 'concours', 'stage', 'cours', 'autre');
create type project_status   as enum ('a_faire', 'en_cours', 'en_pause', 'termine');
create type task_source      as enum ('manuel', 'claude');
create type session_status   as enum ('prevu', 'fait', 'decale', 'annule');

-- Projets : une éval, un projet perso, la prépa CUEC, la recherche de stage...
create table projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  name         text not null,
  category     project_category not null default 'autre',
  status       project_status not null default 'en_cours',
  description  text,
  deadline     timestamptz,
  folder_path  text,            -- ex: C:\Users\Marc\IUT\R3.04  (ouvert via vscode://file/...)
  github_url   text,            -- ex: https://github.com/MarcFoucher7/mon-repo
  color        text not null default '#6366f1',
  created_at   timestamptz not null default now()
);

-- Tâches à cocher, rattachées à un projet
create table tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users on delete cascade,
  project_id        uuid not null references projects on delete cascade,
  title             text not null,
  details           text,
  done              boolean not null default false,
  done_at           timestamptz,
  due_date          date,
  estimated_minutes int,
  position          int not null default 0,
  source            task_source not null default 'manuel',
  created_at        timestamptz not null default now()
);

-- Créneaux de travail planifiés (hors cours, déplaçables)
create table work_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  project_id  uuid references projects on delete cascade,
  task_id     uuid references tasks on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      session_status not null default 'prevu',
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Journal : « j'ai fait ça à tel moment »
create table journal_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  project_id       uuid references projects on delete set null,
  task_id          uuid references tasks on delete set null,
  happened_at      timestamptz not null default now(),
  duration_minutes int,
  note             text not null,
  created_at       timestamptz not null default now()
);

-- Réglages (lien ICS de l'emploi du temps IUT)
create table settings (
  user_id   uuid primary key default auth.uid() references auth.users on delete cascade,
  ics_url   text
);

-- Chaque utilisateur ne voit que ses propres données
alter table projects        enable row level security;
alter table tasks           enable row level security;
alter table work_sessions   enable row level security;
alter table journal_entries enable row level security;
alter table settings        enable row level security;

create policy "own projects" on projects        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks"    on tasks           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own sessions" on work_sessions   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own journal"  on journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own settings" on settings        for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Avancement d'un projet = tâches faites / tâches totales
create view project_progress with (security_invoker = true) as
select p.id as project_id,
       count(t.id)                       as total_tasks,
       count(t.id) filter (where t.done) as done_tasks
from projects p
left join tasks t on t.project_id = p.id
group by p.id;

create index on tasks (project_id);
create index on work_sessions (starts_at);
create index on journal_entries (happened_at desc);
