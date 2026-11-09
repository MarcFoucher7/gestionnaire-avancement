-- V2 : emoji, repo GitHub lié, priorités, créneaux automatiques, préférences de travail.
-- À coller dans Supabase > SQL Editor, puis "Run" (après 0001_init.sql).

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
