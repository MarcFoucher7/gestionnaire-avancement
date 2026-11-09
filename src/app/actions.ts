"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fromLocalInput } from "@/lib/time";
import { autoPlanProject, getSettings } from "@/lib/data";
import { analyzeWithClaude, claudeEnabled, fetchSourceText } from "@/lib/claude";
import { listRepos, type Repo } from "@/lib/github";
import { fetchCourses } from "@/lib/ics";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === null ? null : Number(v);
};
/** Remonte l'erreur Supabase à l'écran au lieu de l'ignorer. */
function must<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(`Base de données : ${res.error.message}`);
  return res;
}
const refresh = () => revalidatePath("/", "layout");

function projectFields(form: FormData) {
  const repo = str(form, "github_repo");
  return {
    name: str(form, "name"),
    emoji: str(form, "emoji") ?? "📁",
    category: str(form, "category") ?? "autre",
    description: str(form, "description"),
    deadline: fromLocalInput(str(form, "deadline")),
    folder_path: str(form, "folder_path"),
    github_repo: repo,
    github_url: repo ? `https://github.com/${repo}` : null,
    color: str(form, "color") ?? "#6366f1",
  };
}

/* ---------- Projets ---------- */

export async function createProject(form: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert(projectFields(form)).select("id").single();
  if (error) throw new Error(error.message);
  refresh();
  redirect(`/projets/${data.id}`);
}

export async function updateProject(id: string, form: FormData) {
  const supabase = await createClient();
  must(await supabase.from("projects").update(projectFields(form)).eq("id", id));
  refresh();
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient();
  must(await supabase.from("projects").update({ status }).eq("id", id));
  refresh();
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  must(await supabase.from("projects").delete().eq("id", id));
  refresh();
  redirect("/");
}

/* ---------- Tâches ---------- */

export async function createTask(projectId: string, form: FormData) {
  const supabase = await createClient();
  must(await supabase.from("tasks").insert({
    project_id: projectId,
    title: str(form, "title"),
    due_date: str(form, "due_date"),
    estimated_minutes: num(form, "estimated_minutes") ?? 60,
    priority: num(form, "priority") ?? 2,
  }));
  refresh();
}

export async function toggleTask(id: string, done: boolean) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id).select("project_id,title").single();
  // Automatisme : chaque tâche cochée s'écrit dans le journal
  if (done && task) {
    must(await supabase.from("journal_entries").insert({ project_id: task.project_id, task_id: id, note: `✅ ${task.title}` }));
    // et ses créneaux futurs prévus ne servent plus à rien
    must(await supabase.from("work_sessions").delete().eq("task_id", id).eq("status", "prevu").gte("starts_at", new Date().toISOString()));
  }
  refresh();
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  must(await supabase.from("tasks").delete().eq("id", id));
  refresh();
}

/* ---------- Planification automatique ---------- */

export async function autoPlan(projectId: string) {
  const supabase = await createClient();
  const res = await autoPlanProject(supabase, projectId);
  refresh();
  return res;
}

/** Les créneaux passés jamais validés sont marqués « décalés » et leurs projets replanifiés. */
export async function replanMissed() {
  const supabase = await createClient();
  const { data } = await supabase.from("work_sessions")
    .update({ status: "decale" })
    .eq("status", "prevu").lt("ends_at", new Date().toISOString())
    .select("project_id");
  const projects = [...new Set((data ?? []).map((s) => s.project_id).filter(Boolean))] as string[];
  for (const p of projects) await autoPlanProject(supabase, p);
  refresh();
  return { moved: data?.length ?? 0 };
}

/* ---------- Créneaux ---------- */

export async function createSession(input: { project_id: string; task_id?: string | null; starts_at: string; ends_at: string; title?: string | null }) {
  const supabase = await createClient();
  must(await supabase.from("work_sessions").insert({ ...input, auto: false }));
  refresh();
}

export async function moveSession(id: string, starts_at: string, ends_at: string) {
  const supabase = await createClient();
  // déplacé à la main → le planificateur n'y touche plus
  must(await supabase.from("work_sessions").update({ starts_at, ends_at, status: "prevu", auto: false }).eq("id", id));
  refresh();
}

export async function setSessionStatus(id: string, status: "prevu" | "fait" | "annule") {
  const supabase = await createClient();
  const { data: s } = await supabase.from("work_sessions").update({ status }).eq("id", id)
    .select("project_id,task_id,title,starts_at,ends_at").single();
  // Automatisme : un créneau « fait » s'écrit dans le journal
  if (status === "fait" && s) {
    must(await supabase.from("journal_entries").insert({
      project_id: s.project_id,
      task_id: s.task_id,
      happened_at: s.starts_at,
      duration_minutes: Math.round((+new Date(s.ends_at) - +new Date(s.starts_at)) / 60_000),
      note: `📚 ${s.title ?? "Session de travail"}`,
    }));
  }
  refresh();
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  must(await supabase.from("work_sessions").delete().eq("id", id));
  refresh();
}

/* ---------- Journal ---------- */

export async function addJournalEntry(form: FormData) {
  const supabase = await createClient();
  must(await supabase.from("journal_entries").insert({
    note: str(form, "note"),
    project_id: str(form, "project_id"),
    happened_at: fromLocalInput(str(form, "happened_at")) ?? new Date().toISOString(),
    duration_minutes: num(form, "duration_minutes"),
  }));
  refresh();
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient();
  must(await supabase.from("journal_entries").delete().eq("id", id));
  refresh();
}

/* ---------- Réglages ---------- */

export async function saveSettings(form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  must(await supabase.from("settings").upsert({
    user_id: user!.id,
    ics_url: str(form, "ics_url"),
    github_login: str(form, "github_login"),
    day_start: num(form, "day_start") ?? 8,
    day_end: num(form, "day_end") ?? 21,
    session_minutes: num(form, "session_minutes") ?? 90,
    daily_cap: num(form, "daily_cap") ?? 180,
    weekends: form.get("weekends") === "on",
  }));
  refresh();
}

/* ---------- GitHub ---------- */

export async function getRepos(): Promise<Repo[]> {
  const supabase = await createClient();
  const settings = await getSettings(supabase);
  return settings.github_login || process.env.GITHUB_TOKEN ? listRepos(settings.github_login ?? "") : [];
}

/* ---------- Projet magique (Claude) ---------- */

export type MagicState = { error?: string } | undefined;

export async function magicProject(_: MagicState, form: FormData): Promise<MagicState> {
  if (!claudeEnabled()) return { error: "Ajoute ANTHROPIC_API_KEY dans les variables Vercel pour activer Claude." };
  const supabase = await createClient();

  const url = str(form, "url");
  let text = str(form, "text") ?? "";
  const file = form.get("file");
  let filePart: { name: string; type: string; base64: string } | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      filePart = { name: file.name, type: file.type, base64: Buffer.from(await file.arrayBuffer()).toString("base64") };
    } else {
      text += `\n\n${await file.text()}`;
    }
  }

  let projectId: string;
  try {
    if (url) text = `${await fetchSourceText(url)}\n\n${text}`;
    if (!text.trim() && !filePart) return { error: "Donne-moi un cours, un fichier ou un lien." };

    const plan = await analyzeWithClaude({ text, sourceUrl: url ?? undefined, file: filePart, hint: str(form, "hint") ?? undefined });
    const { data: project, error } = await supabase.from("projects").insert({
      name: plan.project.name,
      emoji: plan.project.emoji,
      category: plan.project.category,
      description: plan.project.description,
      deadline: fromLocalInput(plan.project.deadline),
      source_url: url,
      color: str(form, "color") ?? "#6366f1",
    }).select("id").single();
    if (error) throw new Error(error.message);
    projectId = project.id;

    must(await supabase.from("tasks").insert(plan.tasks.map((t, i) => ({
      project_id: projectId,
      title: t.title,
      details: t.details,
      estimated_minutes: t.estimated_minutes,
      due_date: t.due_date,
      priority: t.priority,
      position: i,
      source: "claude",
    }))));
    await autoPlanProject(supabase, projectId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  redirect(`/projets/${projectId}`);
}

/* ---------- Calendrier ---------- */

export type CalEvent = {
  id: string; title: string; start: string; end: string;
  kind: "course" | "session"; color?: string; status?: string; projectId?: string | null; location?: string | null;
};

export async function getCalendarEvents(startISO: string, endISO: string): Promise<CalEvent[]> {
  const supabase = await createClient();
  const from = new Date(startISO), to = new Date(endISO);
  const settings = await getSettings(supabase);
  const [{ data: sessions }, { data: projects }, courses] = await Promise.all([
    supabase.from("work_sessions").select("*").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()).neq("status", "annule"),
    supabase.from("projects").select("id,name,emoji,color"),
    settings.ics_url ? fetchCourses(settings.ics_url, from, to).catch(() => []) : Promise.resolve([]),
  ]);
  const byId = new Map((projects ?? []).map((p) => [p.id, p]));
  return [
    ...courses.map((c, i) => ({
      id: `c${i}-${+c.start}`, title: c.title, start: c.start.toISOString(), end: c.end.toISOString(), kind: "course" as const, location: c.location,
    })),
    ...(sessions ?? []).map((s) => {
      const p = s.project_id ? byId.get(s.project_id) : null;
      return {
        id: s.id, kind: "session" as const, start: s.starts_at, end: s.ends_at, status: s.status, projectId: s.project_id,
        title: `${p?.emoji ?? "📚"} ${s.title ?? p?.name ?? "Travail"}`, color: p?.color ?? "#6366f1",
      };
    }),
  ];
}
