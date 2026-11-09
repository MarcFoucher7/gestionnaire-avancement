export type Category = "eval" | "perso" | "concours" | "stage" | "cours" | "autre";
export type Status = "a_faire" | "en_cours" | "en_pause" | "termine";

export type Project = {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  status: Status;
  description: string | null;
  deadline: string | null;
  folder_path: string | null;
  github_url: string | null;
  github_repo: string | null;
  source_url: string | null;
  color: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  details: string | null;
  done: boolean;
  done_at: string | null;
  due_date: string | null;
  estimated_minutes: number | null;
  priority: number;
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
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: "prevu" | "fait" | "decale" | "annule";
  auto: boolean;
};

export type Settings = {
  ics_url: string | null;
  github_login: string | null;
  day_start: number;
  day_end: number;
  session_minutes: number;
  daily_cap: number;
  weekends: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  ics_url: null,
  github_login: null,
  day_start: 8,
  day_end: 21,
  session_minutes: 90,
  daily_cap: 180,
  weekends: true,
};

export const CATEGORY_LABEL: Record<Category, string> = {
  eval: "Éval",
  perso: "Projet perso",
  concours: "Concours",
  stage: "Stage",
  cours: "Cours",
  autre: "Autre",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  eval: "📝",
  perso: "🚀",
  concours: "🏆",
  stage: "💼",
  cours: "📚",
  autre: "📁",
};

export const STATUS_LABEL: Record<Status, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_pause: "En pause",
  termine: "Terminé",
};

export const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444", "#64748b"];

/** Lien qui ouvre un dossier du Mac dans VS Code depuis le navigateur. */
export function vscodeLink(path: string) {
  return `vscode://file/${path.replace(/\\/g, "/")}`;
}

/** Lien avancement:// géré par le petit helper macOS (ouvre le dossier dans le Finder). */
export function finderLink(path: string) {
  return `avancement://open?path=${encodeURIComponent(path)}`;
}
