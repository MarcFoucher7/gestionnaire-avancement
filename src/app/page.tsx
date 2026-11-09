import Link from "next/link";
import { addDays, differenceInCalendarDays, format, isBefore, startOfDay, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, FolderOpen, GitBranch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { fetchCourses, type CourseEvent } from "@/lib/ics";
import { claudeEnabled } from "@/lib/claude";
import { paris } from "@/lib/time";
import { ProgressRing } from "@/components/progress-ring";
import { NewProjectButtons } from "@/components/new-project";
import { SessionRow } from "@/components/session-row";
import { ReplanBanner } from "@/components/replan-banner";
import { CATEGORY_LABEL, type Project, type Task, type WorkSession } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const now = new Date();
  const today = startOfDay(paris(now));
  const tomorrow = addDays(today, 1);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const [{ data: projects }, { data: progress }, { data: todaySessions }, { count: missed }, { data: overdue }, { data: week }, settings] =
    await Promise.all([
      supabase.from("projects").select("*").neq("status", "termine").order("deadline", { nullsFirst: false }),
      supabase.from("project_progress").select("*"),
      supabase.from("work_sessions").select("*").gte("starts_at", today.toISOString()).lt("starts_at", tomorrow.toISOString()).neq("status", "annule").order("starts_at"),
      supabase.from("work_sessions").select("id", { count: "exact", head: true }).eq("status", "prevu").lt("ends_at", now.toISOString()),
      supabase.from("tasks").select("*").eq("done", false).lt("due_date", format(today, "yyyy-MM-dd")).order("due_date").limit(8),
      supabase.from("journal_entries").select("duration_minutes,note").gte("happened_at", weekStart.toISOString()),
      getSettings(supabase),
    ]);

  let courses: CourseEvent[] = [];
  if (settings.ics_url) courses = await fetchCourses(settings.ics_url, today, tomorrow).catch(() => []);

  const list = (projects ?? []) as Project[];
  const byId = new Map(list.map((p) => [p.id, p]));
  const prog = new Map((progress ?? []).map((p) => [p.project_id, p]));
  const minutesThisWeek = (week ?? []).reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const tasksThisWeek = (week ?? []).filter((e) => e.note?.startsWith("✅")).length;
  const next = list.find((p) => p.deadline && !isBefore(new Date(p.deadline), now));

  const timeline = [
    ...courses.map((c) => ({ kind: "course" as const, start: c.start, c })),
    ...((todaySessions ?? []) as WorkSession[]).map((s) => ({ kind: "session" as const, start: new Date(s.starts_at), s })),
  ].sort((a, b) => +a.start - +b.start);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted">{format(today, "EEEE d MMMM", { locale: fr })}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Salut Marc 👋</h1>
        </div>
        <NewProjectButtons claude={claudeEnabled()} />
      </header>

      <ReplanBanner count={missed ?? 0} />

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label="Travaillé cette semaine" value={`${Math.floor(minutesThisWeek / 60)}h${String(minutesThisWeek % 60).padStart(2, "0")}`} />
        <Stat label="Tâches finies cette semaine" value={String(tasksThisWeek)} />
        <Stat label="Prochaine échéance"
          value={next ? `J-${differenceInCalendarDays(paris(next.deadline!), today)}` : "—"}
          sub={next ? `${next.emoji} ${next.name}` : "Rien de prévu"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="card min-w-0 p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Aujourd&apos;hui</h2>
            <Link href="/calendrier" className="text-xs text-accent">Voir la semaine →</Link>
          </div>
          <div className="space-y-2">
            {!timeline.length && <p className="text-sm text-muted">Rien de prévu aujourd&apos;hui. Profite, ou lance un projet magique ✨</p>}
            {timeline.map((t, i) =>
              t.kind === "course" ? (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-bg/60 px-3 py-2 text-sm text-muted">
                  <span className="w-24 shrink-0 text-xs tabular-nums">{format(paris(t.c.start), "HH:mm")} – {format(paris(t.c.end), "HH:mm")}</span>
                  <span className="truncate">🎓 {t.c.title}</span>
                  {t.c.location && <span className="chip ml-auto shrink-0">{t.c.location}</span>}
                </div>
              ) : (
                <SessionRow key={t.s.id} session={t.s} project={t.s.project_id ? byId.get(t.s.project_id) : undefined} />
              ),
            )}
          </div>
        </div>

        <div className="card min-w-0 p-5 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle size={16} className="text-amber-500" /> En retard</h2>
          {!overdue?.length && <p className="text-sm text-muted">Rien en retard, bien joué 🎉</p>}
          <ul className="space-y-2">
            {((overdue ?? []) as Task[]).map((t) => {
              const p = byId.get(t.project_id);
              return (
                <li key={t.id}>
                  <Link href={`/projets/${t.project_id}`} className="block rounded-xl px-2 py-1.5 hover:bg-bg">
                    <p className="text-sm">{t.title}</p>
                    <p className="text-xs text-muted">{p?.emoji} {p?.name} · prévu le {format(new Date(t.due_date!), "d MMM", { locale: fr })}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Projets en cours</h2>
        {!list.length && (
          <div className="card p-10 text-center text-muted">
            <p className="text-4xl">🗂️</p>
            <p className="mt-2">Aucun projet pour l&apos;instant. Crée ton premier avec ✨ Projet magique.</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const pr = prog.get(p.id);
            const ratio = pr && pr.total_tasks ? pr.done_tasks / pr.total_tasks : 0;
            const days = p.deadline ? differenceInCalendarDays(paris(p.deadline), today) : null;
            return (
              <Link key={p.id} href={`/projets/${p.id}`}
                className="card group relative flex flex-col gap-4 overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${p.color}1f` }}>{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted">{CATEGORY_LABEL[p.category]}{pr ? ` · ${pr.done_tasks}/${pr.total_tasks} tâches` : ""}</p>
                  </div>
                  <ProgressRing value={ratio} color={p.color} />
                </div>
                <div className="mt-auto flex items-center gap-2 text-xs text-muted">
                  {days !== null && (
                    <span className={`chip ${days <= 2 ? "border-red-500/50 text-red-500" : ""}`}>
                      {days < 0 ? "dépassé" : days === 0 ? "aujourd'hui" : `J-${days}`} · {format(paris(p.deadline!), "d MMM", { locale: fr })}
                    </span>
                  )}
                  <span className="ml-auto flex gap-2">
                    {p.folder_path && <FolderOpen size={14} />}
                    {p.github_repo && <GitBranch size={14} />}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card min-w-0 p-3 sm:p-5">
      <p className="text-[10px] uppercase tracking-wide text-muted sm:text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}
