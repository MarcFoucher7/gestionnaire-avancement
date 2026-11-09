"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fromLocalInput } from "@/lib/time";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

export async function createProject(form: FormData) {
  const supabase = await createClient();
  await supabase.from("projects").insert({
    name: str(form, "name"),
    category: str(form, "category") ?? "autre",
    deadline: fromLocalInput(str(form, "deadline")),
    folder_path: str(form, "folder_path"),
    github_url: str(form, "github_url"),
    color: str(form, "color") ?? "#6366f1",
  });
  revalidatePath("/");
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("projects").update({ status }).eq("id", id);
  revalidatePath("/");
  revalidatePath(`/projets/${id}`);
}

export async function createTask(projectId: string, form: FormData) {
  const supabase = await createClient();
  await supabase.from("tasks").insert({
    project_id: projectId,
    title: str(form, "title"),
    due_date: str(form, "due_date"),
  });
  revalidatePath(`/projets/${projectId}`);
}

export async function toggleTask(id: string, projectId: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath(`/projets/${projectId}`);
  revalidatePath("/");
}

export async function deleteTask(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath(`/projets/${projectId}`);
}

export async function addJournalEntry(form: FormData) {
  const supabase = await createClient();
  const minutes = str(form, "duration_minutes");
  await supabase.from("journal_entries").insert({
    note: str(form, "note"),
    project_id: str(form, "project_id"),
    happened_at: fromLocalInput(str(form, "happened_at")) ?? new Date().toISOString(),
    duration_minutes: minutes ? Number(minutes) : null,
  });
  revalidatePath("/journal");
}

export async function saveIcsUrl(form: FormData) {
  const supabase = await createClient();
  await supabase.from("settings").upsert({ ics_url: str(form, "ics_url") });
  revalidatePath("/agenda");
}

export async function planSession(form: FormData) {
  const supabase = await createClient();
  await supabase.from("work_sessions").insert({
    project_id: str(form, "project_id"),
    starts_at: fromLocalInput(str(form, "starts_at")),
    ends_at: fromLocalInput(str(form, "ends_at")),
  });
  revalidatePath("/agenda");
}

export async function setSessionStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("work_sessions").update({ status }).eq("id", id);
  revalidatePath("/agenda");
}

export async function moveSession(id: string, form: FormData) {
  const supabase = await createClient();
  await supabase.from("work_sessions")
    .update({ starts_at: fromLocalInput(str(form, "starts_at")), ends_at: fromLocalInput(str(form, "ends_at")), status: "prevu" })
    .eq("id", id);
  revalidatePath("/agenda");
}
