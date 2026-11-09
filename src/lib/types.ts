export type Category = "eval" | "perso" | "concours" | "stage" | "cours" | "autre";
export type Status = "a_faire" | "en_cours" | "en_pause" | "termine";

export type Project = {
  id: string;
  name: string;
  category: Category;
  status: Status;
  description: string | null;
  deadline: string | null;
  folder_path: string | null;
  github_url: string | null;
  color: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  details: string | null;
  done: boolean;
  due_date: string | null;
  estimated_minutes: number | null;
  source: "manuel" | "claude";
};

export type JournalEntry = {
  id: string;
  project_id: string | null;
  happened_at: string;
  duration_minutes: number | null;
  note: string;
};

export type WorkSession = {
  id: string;
  project_id: string | null;
  task_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "prevu" | "fait" | "decale" | "annule";
};

export const CATEGORY_LABEL: Record<Category, string> = {
  eval: "Éval",
  perso: "Projet perso",
  concours: "Concours",
  stage: "Stage",
  cours: "Cours",
  autre: "Autre",
};

export const STATUS_LABEL: Record<Status, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_pause: "En pause",
  termine: "Terminé",
};

/** Lien qui ouvre un dossier du PC dans VS Code depuis le navigateur. */
export function vscodeLink(path: string) {
  return `vscode://file/${path.replace(/\\/g, "/")}`;
}
