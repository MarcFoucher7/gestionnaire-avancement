import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { planSession, saveIcsUrl } from "@/app/actions";
import { fetchCourses, freeSlots, type CourseEvent } from "@/lib/ics";
import { SessionCard } from "@/components/session-card";
import { paris } from "@/lib/time";
import type { Project, WorkSession } from "@/lib/types";

const hm = (d: Date) => format(paris(d), "HH'h'mm");

export default async function AgendaPage() {
  const supabase = await createClient();
  const from = startOfDay(paris(Date.now()));
  const to = addDays(from, 7);

  const [{ data: settings }, { data: sessions }, { data: projects }] = await Promise.all([
    supabase.from("settings").select("ics_url").maybeSingle(),
    supabase.from("work_sessions").select("*").gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString()).order("starts_at"),
    supabase.from("projects").select("id,name,color").neq("status", "termine"),
  ]);

  let courses: CourseEvent[] = [];
  let icsError: string | null = null;
  if (settings?.ics_url) {
    try { courses = await fetchCourses(settings.ics_url, from, to); }
    catch (e) { icsError = (e as Error).message; }
  }
  const projectById = new Map((projects as Project[] | null ?? []).map((p) => [p.id, p]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
        <p className="mt-1 text-muted">Tes cours, tes créneaux de travail, et les trous où caser des révisions.</p>
      </div>

      <form action={saveIcsUrl} className="card flex gap-2 p-4">
        <input name="ics_url" defaultValue={settings?.ics_url ?? ""} placeholder="Lien ICS de l'emploi du temps IUT" className="input" />
        <button className="btn-primary whitespace-nowrap">Enregistrer</button>
      </form>
      {icsError && <p className="text-sm text-red-500">{icsError}</p>}

      <div className="space-y-4">
        {days.map((day) => {
          const dayCourses = courses.filter((c) => isSameDay(paris(c.start), day));
          const daySessions = (sessions as WorkSession[] | null ?? []).filter((s) => isSameDay(paris(s.starts_at), day));
          const busy = [
            ...dayCourses,
            ...daySessions.filter((s) => s.status !== "annule").map((s) => ({ start: new Date(s.starts_at), end: new Date(s.ends_at) })),
          ];
          const free = freeSlots(day, busy);
          return (
            <section key={day.toISOString()} className="card p-4">
              <h2 className="font-semibold capitalize">{format(day, "EEEE d MMMM", { locale: fr })}</h2>
              <div className="mt-3 space-y-2">
                {dayCourses.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-bg px-3 py-2 text-sm">
                    <span className="w-28 text-muted">{hm(c.start)} – {hm(c.end)}</span>
                    <span>🎓 {c.title}</span>
                    {c.location && <span className="chip ml-auto">{c.location}</span>}
                  </div>
                ))}
                {daySessions.map((s) => (
                  <SessionCard key={s.id} session={s} project={s.project_id ? projectById.get(s.project_id) : undefined} />
                ))}
                {free.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {free.map((f, i) => (
                      <span key={i} className="chip">libre {hm(f.start)} – {hm(f.end)}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <form action={planSession} className="card grid gap-3 p-5 sm:grid-cols-4">
        <p className="font-medium sm:col-span-4">Planifier un créneau de travail</p>
        <select name="project_id" className="input">
          {(projects as Project[] | null)?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="starts_at" type="datetime-local" required className="input" />
        <input name="ends_at" type="datetime-local" required className="input" />
        <button className="btn-primary">Planifier</button>
      </form>
    </div>
  );
}
