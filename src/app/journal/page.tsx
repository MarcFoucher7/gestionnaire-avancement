import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { addJournalEntry } from "@/app/actions";
import { paris } from "@/lib/time";
import { DatePicker } from "@/components/date-picker";
import type { JournalEntry, Project } from "@/lib/types";

export default async function JournalPage() {
  const supabase = await createClient();
  const [{ data: entries }, { data: projects }] = await Promise.all([
    supabase.from("journal_entries").select("*").order("happened_at", { ascending: false }).limit(200),
    supabase.from("projects").select("id,name,emoji,color"),
  ]);
  const byId = new Map(((projects ?? []) as Project[]).map((p) => [p.id, p]));
  const list = (entries ?? []) as JournalEntry[];

  // regroupe par jour
  const days: { day: Date; items: JournalEntry[]; minutes: number }[] = [];
  for (const e of list) {
    const d = paris(e.happened_at);
    const last = days.at(-1);
    if (last && isSameDay(last.day, d)) { last.items.push(e); last.minutes += e.duration_minutes ?? 0; }
    else days.push({ day: d, items: [e], minutes: e.duration_minutes ?? 0 });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-muted">Ce que tu as vraiment fait. Les tâches cochées et les créneaux faits s&apos;ajoutent tout seuls.</p>
      </div>

      <form action={addJournalEntry} className="card grid gap-3 p-5 sm:grid-cols-6">
        <textarea name="note" required placeholder="J'ai fait… (ex : 2 annales CUEC de maths)" className="input sm:col-span-6" rows={2} />
        <select name="project_id" className="input sm:col-span-2">
          <option value="">Sans projet</option>
          {((projects ?? []) as Project[]).map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>
        <div className="sm:col-span-2"><DatePicker name="happened_at" placeholder="Maintenant" /></div>
        <input name="duration_minutes" type="number" min={5} step={5} placeholder="Durée (min)" className="input" />
        <button className="btn-primary">Noter</button>
      </form>

      {!days.length && <p className="text-muted">Rien pour l&apos;instant.</p>}
      {days.map(({ day, items, minutes }) => (
        <section key={day.toISOString()}>
          <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold capitalize">
            {format(day, "EEEE d MMMM", { locale: fr })}
            {minutes > 0 && <span className="text-xs font-normal text-muted">· {Math.floor(minutes / 60)}h{String(minutes % 60).padStart(2, "0")}</span>}
          </h2>
          <ol className="card divide-y divide-border">
            {items.map((e) => {
              const p = e.project_id ? byId.get(e.project_id) : null;
              return (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted">{format(paris(e.happened_at), "HH:mm")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{e.note}</p>
                    {(p || e.duration_minutes) && (
                      <p className="text-xs text-muted">{p && <span style={{ color: p.color }}>{p.emoji} {p.name}</span>}{e.duration_minutes ? ` · ${e.duration_minutes} min` : ""}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
