import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Code2, ExternalLink, FolderOpen, GitBranch, GitCommit } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { recentCommits } from "@/lib/github";
import { paris } from "@/lib/time";
import { TaskItem } from "@/components/task-item";
import { AddTask } from "@/components/add-task";
import { ProjectActions } from "@/components/project-actions";
import { SessionRow } from "@/components/session-row";
import { CATEGORY_LABEL, finderLink, vscodeLink, type Project, type Task, type WorkSession } from "@/lib/types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, { data: sessions }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single<Project>(),
    supabase.from("tasks").select("*").eq("project_id", id).order("done").order("position").order("due_date", { nullsFirst: false }),
    supabase.from("work_sessions").select("*").eq("project_id", id).gte("ends_at", new Date().toISOString()).neq("status", "annule").order("starts_at").limit(12),
  ]);
  if (!project) notFound();
  const commits = project.github_repo ? await recentCommits(project.github_repo) : [];

  const list = (tasks ?? []) as Task[];
  const done = list.filter((t) => t.done).length;
  const ratio = list.length ? done / list.length : 0;
  const minutesLeft = list.filter((t) => !t.done).reduce((s, t) => s + (t.estimated_minutes ?? 60), 0);
  const days = project.deadline ? differenceInCalendarDays(paris(project.deadline), startOfDay(paris(new Date()))) : null;

  return (
    <div className="space-y-6">
      <Link href="/" className="btn-ghost inline-flex items-center gap-1"><ArrowLeft size={16} /> Accueil</Link>

      <div className="card relative overflow-hidden p-6">
        <div className="absolute inset-0 opacity-[0.07]" style={{ background: `radial-gradient(circle at top left, ${project.color}, transparent 60%)` }} />
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="grid size-16 place-items-center rounded-3xl text-4xl" style={{ background: `${project.color}22` }}>{project.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: project.color }}>{CATEGORY_LABEL[project.category]}</p>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            {project.deadline && (
              <p className="text-sm text-muted">
                {format(paris(project.deadline), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
                {days !== null && <b className={days <= 2 ? "text-red-500" : ""}> · {days < 0 ? "dépassé" : days === 0 ? "aujourd'hui !" : `dans ${days} jour${days > 1 ? "s" : ""}`}</b>}
              </p>
            )}
            {project.description && <p className="mt-2 max-w-2xl text-sm">{project.description}</p>}
          </div>
        </div>

        <div className="relative mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ratio * 100}%`, background: project.color }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {Math.round(ratio * 100)} % · {done}/{list.length} tâches · reste ≈ {Math.floor(minutesLeft / 60)}h{String(minutesLeft % 60).padStart(2, "0")} de travail
          </p>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          {project.folder_path && (
            <>
              <a href={finderLink(project.folder_path)} className="btn-ghost flex items-center gap-1.5 border border-border" title={project.folder_path}>
                <FolderOpen size={16} /> Finder
              </a>
              <a href={vscodeLink(project.folder_path)} className="btn-ghost flex items-center gap-1.5 border border-border">
                <Code2 size={16} /> VS Code
              </a>
            </>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" className="btn-ghost flex items-center gap-1.5 border border-border">
              <GitBranch size={16} /> {project.github_repo}
            </a>
          )}
          {project.source_url && (
            <a href={project.source_url} target="_blank" className="btn-ghost flex items-center gap-1.5 border border-border">
              <ExternalLink size={16} /> Source
            </a>
          )}
          <div className="ml-auto"><ProjectActions project={project} /></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card min-w-0 divide-y divide-border overflow-hidden lg:col-span-2">
          <h2 className="px-4 py-3 font-semibold">Tâches</h2>
          {list.map((t) => <TaskItem key={t.id} task={t} color={project.color} />)}
          <AddTask projectId={project.id} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="card p-4">
            <h2 className="mb-3 font-semibold">Prochains créneaux</h2>
            {!sessions?.length && <p className="text-sm text-muted">Aucun créneau. Clique sur « Planifier mes révisions ».</p>}
            <div className="space-y-2">
              {((sessions ?? []) as WorkSession[]).map((s) => (
                <div key={s.id}>
                  <p className="mb-1 text-[11px] font-medium capitalize text-muted">{format(paris(s.starts_at), "EEEE d MMM", { locale: fr })}</p>
                  <SessionRow session={s} compact />
                </div>
              ))}
            </div>
          </div>

          {project.github_repo && (
            <div className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><GitCommit size={16} /> Derniers commits</h2>
              {!commits.length && <p className="text-sm text-muted">Aucun commit visible (repo privé ? ajoute GITHUB_TOKEN dans Vercel).</p>}
              <ul className="space-y-2">
                {commits.map((c) => (
                  <li key={c.sha}>
                    <a href={c.url} target="_blank" className="block rounded-lg px-2 py-1 hover:bg-bg">
                      <p className="truncate text-sm">{c.message}</p>
                      <p className="text-xs text-muted"><code>{c.sha}</code> · {format(new Date(c.date), "d MMM HH:mm", { locale: fr })}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
