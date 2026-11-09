import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { addJournalEntry } from "@/app/actions";
import { paris } from "@/lib/time";
import type { JournalEntry, Project } from "@/lib/types";

export default async function JournalPage() {
  const supabase = await createClient();
  const [{ data: entries }, { data: projects }] = await Promise.all([
    supabase.from("journal_entries").select("*").order("happened_at", { ascending: false }).limit(100),
    supabase.from("projects").select("id,name,color"),
  ]);
  const byId = new Map((projects as Project[] | null ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-muted">Ce que tu as vraiment fait, et quand.</p>
      </div>

      <form action={addJournalEntry} className="card grid gap-3 p-5 sm:grid-cols-4">
        <textarea name="note" required placeholder="J'ai fait… (ex : 2 annales CUEC de maths)" className="input sm:col-span-4" rows={2} />
        <select name="project_id" className="input">
          <option value="">Sans projet</option>
          {(projects as Project[] | null)?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="happened_at" type="datetime-local" className="input" />
        <input name="duration_minutes" type="number" min={5} step={5} placeholder="Durée (min)" className="input" />
        <button className="btn-primary">Noter</button>
      </form>

      <ol className="relative space-y-4 border-l border-border pl-6">
        {(entries as JournalEntry[] | null)?.map((e) => {
          const p = e.project_id ? byId.get(e.project_id) : null;
          return (
            <li key={e.id} className="relative">
              <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full" style={{ background: p?.color ?? "var(--muted)" }} />
              <p className="text-xs text-muted">
                {format(paris(e.happened_at), "EEEE d MMM, HH'h'mm", { locale: fr })}
                {e.duration_minutes && ` · ${e.duration_minutes} min`}
                {p && ` · ${p.name}`}
              </p>
              <p>{e.note}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
