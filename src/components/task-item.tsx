"use client";

import { useOptimistic, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Trash2 } from "lucide-react";
import { deleteTask, toggleTask } from "@/app/actions";
import type { Task } from "@/lib/types";

const PRIO = { 1: "🔴", 2: "", 3: "⚪" } as Record<number, string>;

export function TaskItem({ task, color }: { task: Task; color: string }) {
  const [done, setDone] = useOptimistic(task.done);
  const [, start] = useTransition();
  const late = !done && task.due_date && task.due_date < format(new Date(), "yyyy-MM-dd");

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition hover:bg-bg/50">
      <button
        onClick={() => start(async () => { setDone(!done); await toggleTask(task.id, !done); })}
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition"
        style={{ borderColor: color, background: done ? color : "transparent" }}
        aria-label={done ? "Décocher" : "Cocher"}>
        {done && <span className="text-xs text-white">✓</span>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${done ? "text-muted line-through" : ""}`}>
          {PRIO[task.priority]} {task.source === "claude" && <span title="Créée par Claude">✨ </span>}{task.title}
        </p>
        {task.details && !done && <p className="mt-0.5 text-xs text-muted">{task.details}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
        {task.estimated_minutes && <span className="flex items-center gap-1"><Clock size={12} />{task.estimated_minutes} min</span>}
        {task.due_date && (
          <span className={`chip ${late ? "border-red-500/50 text-red-500" : ""}`}>{format(new Date(task.due_date), "EEE d MMM", { locale: fr })}</span>
        )}
        <button onClick={() => start(() => deleteTask(task.id))} className="opacity-0 transition hover:text-red-500 group-hover:opacity-100" aria-label="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
