-- Installation complète de la base (V1 + V2), à coller en une fois dans Supabase > SQL Editor > Run.
-- Peut être relancé sans risque.


do $$ begin create type project_category as enum ('eval', 'perso', 'concours', 'stage', 'cours', 'autre'); exception when duplicate_object then null; end $$;
do $$ begin create type project_status as enum ('a_faire', 'en_cours', 'en_pause', 'termine'); exception when duplicate_object then null; end $$;
do $$ begin create type task_source as enum ('manuel', 'claude'); exception when duplicate_object then null; end $$;
do $$ begin create type session_status as enum ('prevu', 'fait', 'decale', 'annule'); exception when duplicate_object then null; end $$;

-- Projets : une éval, un projet perso, la prépa CUEC, la recherche de stage...
create table if not exists projects (
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
create table if not exists tasks (
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
create table if not exists work_sessions (
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
create table if not exists journal_entries (
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
create table if not exists settings (
  user_id   uuid primary key default auth.uid() references auth.users on delete cascade,
  ics_url   text
);

-- Chaque utilisateur ne voit que ses propres données
alter table projects        enable row level security;
alter table tasks           enable row level security;
alter table work_sessions   enable row level security;
alter table journal_entries enable row level security;
alter table settings        enable row level security;

drop policy if exists "own projects" on projects;
create policy "own projects" on projects        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks"    on tasks           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own sessions" on work_sessions;
create policy "own sessions" on work_sessions   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own journal"  on journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own settings" on settings;
create policy "own settings" on settings        for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Avancement d'un projet = tâches faites / tâches totales
create or replace view project_progress with (security_invoker = true) as
select p.id as project_id,
       count(t.id)                       as total_tasks,
       count(t.id) filter (where t.done) as done_tasks
from projects p
left join tasks t on t.project_id = p.id
group by p.id;

create index if not exists tasks_project_idx on tasks (project_id);
create index if not exists work_sessions_starts_idx on work_sessions (starts_at);
create index if not exists journal_happened_idx on journal_entries (happened_at desc);



alter table projects add column if not exists emoji       text not null default '📁';
alter table projects add column if not exists github_repo text;          -- "MarcFoucher7/mon-repo"
alter table projects add column if not exists source_url  text;          -- lien de la conv Claude / du cours d'origine

alter table tasks add column if not exists priority smallint not null default 2;  -- 1 haute, 2 normale, 3 basse

alter table work_sessions add column if not exists title text;
alter table work_sessions add column if not exists auto  boolean not null default false;  -- placé par le planificateur

alter table settings add column if not exists github_login     text;
alter table settings add column if not exists day_start        smallint not null default 8;    -- heure de début de journée de travail
alter table settings add column if not exists day_end          smallint not null default 21;   -- heure de fin
alter table settings add column if not exists session_minutes  smallint not null default 90;   -- durée max d'un créneau
alter table settings add column if not exists daily_cap        smallint not null default 180;  -- minutes max par jour et par projet
alter table settings add column if not exists weekends         boolean  not null default true;

create index if not exists work_sessions_project_idx on work_sessions (project_id);

-- Recharge le cache de l'API pour que l'app voie les tables tout de suite
notify pgrst, 'reload schema';
