import "server-only";
import { addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCourses } from "./ics";
import { fromLocalInput } from "./time";
import { planSessions, type Interval } from "./planner";
import { DEFAULT_SETTINGS, type Project, type Settings, type Task } from "./types";

export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from("settings").select("*").maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

/** Créneaux occupés : cours de l'IUT + créneaux de travail déjà prévus. */
export async function getBusy(supabase: SupabaseClient, settings: Settings, from: Date, to: Date) {
  const busy: Interval[] = [];
  if (settings.ics_url) {
    try {
      busy.push(...(await fetchCourses(settings.ics_url, from, to)));
    } catch {
      // EDT inaccessible : on planifie quand même
    }
  }
  const { data } = await supabase.from("work_sessions").select("starts_at,ends_at,project_id,auto,status")
    .lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()).neq("status", "annule");
  for (const s of data ?? []) busy.push({ start: new Date(s.starts_at), end: new Date(s.ends_at) });
  return busy;
}

/**
 * Replanifie un projet : supprime ses futurs créneaux automatiques non faits,
 * puis place ses tâches restantes dans les trous libres avant l'échéance.
 */
export async function autoPlanProject(supabase: SupabaseClient, projectId: string) {
  const now = new Date();
  const [{ data: project }, { data: tasks }, { data: doneSessions }, settings] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single<Project>(),
    supabase.from("tasks").select("*").eq("project_id", projectId).eq("done", false),
    supabase.from("work_sessions").select("task_id,starts_at,ends_at")
      .eq("project_id", projectId).or(`status.eq.fait,auto.eq.false,starts_at.lt.${now.toISOString()}`).neq("status", "annule"),
    getSettings(supabase),
  ]);
  if (!project) return { planned: 0, unplanned: 0 };

  await supabase.from("work_sessions").delete()
    .eq("project_id", projectId).eq("auto", true).eq("status", "prevu").gte("starts_at", now.toISOString());

  // temps déjà passé ou réservé à la main sur chaque tâche
  const spent = new Map<string, number>();
  for (const s of doneSessions ?? []) {
    if (!s.task_id) continue;
    spent.set(s.task_id, (spent.get(s.task_id) ?? 0) + (+new Date(s.ends_at) - +new Date(s.starts_at)) / 60_000);
  }

  const deadline = project.deadline ? new Date(project.deadline) : null;
  const to = deadline ?? addDays(now, 14);
  const busy = await getBusy(supabase, settings, now, to);
  const planTasks = ((tasks ?? []) as Task[])
    .map((t) => ({
      id: t.id,
      title: t.title,
      minutes: Math.max(0, (t.estimated_minutes ?? 60) - (spent.get(t.id) ?? 0)),
      due: t.due_date ? new Date(fromLocalInput(`${t.due_date}T23:59`)!) : null,
      priority: t.priority ?? 2,
    }))
    .filter((t) => t.minutes >= 15);

  const { sessions, unplanned } = planSessions(planTasks, busy, settings, now, deadline);
  if (sessions.length) {
    await supabase.from("work_sessions").insert(sessions.map((s) => ({
      project_id: projectId,
      task_id: s.task_id,
      title: s.title,
      starts_at: s.start.toISOString(),
      ends_at: s.end.toISOString(),
      auto: true,
    })));
  }
  return { planned: sessions.length, unplanned: unplanned.length };
}
