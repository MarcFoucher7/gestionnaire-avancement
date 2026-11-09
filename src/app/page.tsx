import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FolderOpen, GitBranch, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";
import { ProgressRing } from "@/components/progress-ring";
import { CATEGORY_LABEL, STATUS_LABEL, type Project } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: projects }, { data: progress }] = await Promise.all([
    supabase.from("projects").select("*").neq("status", "termine").order("deadline", { nullsFirst: false }),
    supabase.from("project_progress").select("*"),
  ]);
  const prog = new Map((progress ?? []).map((p) => [p.project_id, p]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Mes projets en cours</h1>
        <p className="mt-1 text-muted">Tout ce qui est sur le feu, au même endroit.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(projects as Project[] | null)?.map((p) => {
          const pr = prog.get(p.id);
          const ratio = pr && pr.total_tasks ? pr.done_tasks / pr.total_tasks : 0;
          return (
            <Link key={p.id} href={`/projets/${p.id}`}
              className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="chip" style={{ borderColor: p.color, color: p.color }}>
                    {CATEGORY_LABEL[p.category]}
                  </span>
                  <h2 className="mt-2 font-semibold leading-tight">{p.name}</h2>
                </div>
                <ProgressRing value={ratio} color={p.color} />
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{STATUS_LABEL[p.status]}</span>
                {pr && <span>· {pr.done_tasks}/{pr.total_tasks} tâches</span>}
                {p.deadline && (
                  <span>· {formatDistanceToNow(new Date(p.deadline), { addSuffix: true, locale: fr })}</span>
                )}
                {p.folder_path && <FolderOpen size={14} />}
                {p.github_url && <GitBranch size={14} />}
              </div>
            </Link>
          );
        })}
      </div>

      <details className="card p-5">
        <summary className="flex cursor-pointer items-center gap-2 font-medium"><Plus size={16} /> Nouveau projet</summary>
        <form action={createProject} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Nom (ex : Éval R3.04 jeudi)" className="input sm:col-span-2" />
          <select name="category" className="input">
            {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="deadline" type="datetime-local" className="input" />
          <input name="folder_path" placeholder="Dossier PC (C:\Users\...)" className="input" />
          <input name="github_url" placeholder="https://github.com/..." className="input" />
          <label className="flex items-center gap-2 text-sm text-muted">
            Couleur <input name="color" type="color" defaultValue="#6366f1" />
          </label>
          <button className="btn-primary sm:justify-self-end">Créer</button>
        </form>
      </details>
    </div>
  );
}
