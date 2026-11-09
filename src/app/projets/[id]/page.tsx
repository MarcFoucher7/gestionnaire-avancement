import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, FolderOpen, GitBranch, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions";
import { TaskItem } from "@/components/task-item";
import { StatusSelect } from "@/components/status-select";
import { paris } from "@/lib/time";
import { CATEGORY_LABEL, vscodeLink, type Project, type Task } from "@/lib/types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single<Project>(),
    supabase.from("tasks").select("*").eq("project_id", id).order("done").order("due_date", { nullsFirst: false }).order("position"),
  ]);
  if (!project) notFound();

  const list = (tasks ?? []) as Task[];
  const done = list.filter((t) => t.done).length;
  const ratio = list.length ? done / list.length : 0;

  return (
    <div className="space-y-6">
      <Link href="/" className="btn-ghost inline-flex items-center gap-1"><ArrowLeft size={16} /> Projets</Link>

      <div className="card p-6">
        <span className="chip" style={{ borderColor: project.color, color: project.color }}>
          {CATEGORY_LABEL[project.category]}
        </span>
        <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
        {project.deadline && (
          <p className="text-sm text-muted">Échéance : {format(paris(project.deadline), "EEEE d MMMM, HH'h'mm", { locale: fr })}</p>
        )}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, background: project.color }} />
        </div>
        <p className="mt-1 text-xs text-muted">{done}/{list.length} tâches faites</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusSelect id={project.id} value={project.status} />
          {project.folder_path && (
            <a href={vscodeLink(project.folder_path)} className="btn-ghost flex items-center gap-1 border border-border">
              <FolderOpen size={16} /> Ouvrir le dossier
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" className="btn-ghost flex items-center gap-1 border border-border">
              <GitBranch size={16} /> GitHub
            </a>
          )}
        </div>
      </div>

      <div className="card divide-y divide-border">
        {list.map((t) => <TaskItem key={t.id} task={t} />)}
        <form action={createTask.bind(null, project.id)} className="flex gap-2 p-3">
          <input name="title" required placeholder="Ajouter une tâche…" className="input" />
          <input name="due_date" type="date" className="input w-40" />
          <button className="btn-primary">Ajouter</button>
        </form>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Sparkles size={14} /> Les tâches marquées ✨ ont été créées par Claude à partir de ton cours.
      </p>
    </div>
  );
}
