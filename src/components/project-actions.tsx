"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, Wand2 } from "lucide-react";
import { autoPlan, deleteProject, updateProject, updateProjectStatus } from "@/app/actions";
import { STATUS_LABEL, type Project, type Status } from "@/lib/types";
import { Modal } from "./ui/modal";
import { Popover } from "./ui/popover";
import { ProjectForm } from "./project-form";

export function ProjectActions({ project }: { project: Project }) {
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn-primary flex items-center gap-2" disabled={pending}
        onClick={() => start(async () => {
          const r = await autoPlan(project.id);
          setMsg(r.planned ? `${r.planned} créneau${r.planned > 1 ? "x" : ""} placé${r.planned > 1 ? "s" : ""} dans ton agenda${r.unplanned ? `, ${r.unplanned} tâche(s) ne rentrent pas avant l'échéance` : ""}.` : "Rien à planifier (tâches finies ou pas de place).");
        })}>
        <Wand2 size={16} className={pending ? "animate-pulse" : ""} /> {pending ? "Je planifie…" : "Planifier mes révisions"}
      </button>
      <select defaultValue={project.status} className="input w-auto" onChange={(e) => start(() => updateProjectStatus(project.id, e.target.value))}>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </select>
      <Popover align="right" className="w-44" trigger={() => <button className="btn-ghost border border-border"><MoreHorizontal size={16} /></button>}>
        {(close) => (
          <div className="space-y-1">
            <button className="btn-ghost flex w-full items-center gap-2" onClick={() => { setEdit(true); close(); }}><Pencil size={14} /> Modifier</button>
            <button className="btn-ghost flex w-full items-center gap-2 text-red-500"
              onClick={() => { if (confirm(`Supprimer « ${project.name} » et toutes ses tâches ?`)) start(() => deleteProject(project.id)); }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        )}
      </Popover>
      {msg && <p className="w-full text-sm text-muted">{msg}</p>}
      <Modal open={edit} onClose={() => setEdit(false)} title="Modifier le projet" wide>
        <ProjectForm project={project} submitLabel="Enregistrer"
          action={async (f) => { await updateProject(project.id, f); setEdit(false); }} />
      </Modal>
    </div>
  );
}
