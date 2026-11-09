"use client";

import { useFormStatus } from "react-dom";
import { CATEGORY_EMOJI, CATEGORY_LABEL, type Category, type Project } from "@/lib/types";
import { EmojiPicker } from "./emoji-picker";
import { DatePicker } from "./date-picker";
import { ColorPicker } from "./color-picker";
import { FolderField } from "./folder-field";
import { RepoPicker } from "./repo-picker";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? "…" : label}</button>;
}

export function ProjectForm({ action, project, submitLabel = "Créer le projet" }: {
  action: (f: FormData) => void | Promise<void>;
  project?: Project;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="flex items-center gap-3">
        <EmojiPicker inline defaultValue={project?.emoji ?? "📝"} />
        <input name="name" required autoFocus defaultValue={project?.name} placeholder="Nom du projet"
          className="input !border-transparent !bg-transparent px-0 text-xl font-semibold" />
      </div>

      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="category" value={c} defaultChecked={(project?.category ?? "eval") === c} className="peer sr-only" />
              <span className="chip !py-1 !text-sm peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent">
                {CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Échéance">
        <DatePicker inline name="deadline" defaultValue={project?.deadline} placeholder="Date de l'éval, du rendu…" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Dossier sur le Mac"><FolderField defaultValue={project?.folder_path} /></Field>
        <Field label="Repo GitHub"><RepoPicker inline defaultValue={project?.github_repo} /></Field>
      </div>

      <Field label="Description">
        <textarea name="description" rows={2} defaultValue={project?.description ?? ""} placeholder="Ce qu'il faut rendre, ce qui sera évalué…" className="input" />
      </Field>

      <Field label="Couleur"><ColorPicker defaultValue={project?.color} /></Field>

      <div className="flex justify-end"><Submit label={submitLabel} /></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {children}
    </div>
  );
}
