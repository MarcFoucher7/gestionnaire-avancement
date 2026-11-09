"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask, toggleTask } from "@/app/actions";
import type { Task } from "@/lib/types";

export function TaskItem({ task }: { task: Task }) {
  const [done, setDone] = useOptimistic(task.done);
  const [, start] = useTransition();

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <input type="checkbox" checked={done} className="size-4 accent-[var(--accent)]"
        onChange={(e) => {
          const v = e.target.checked;
          start(async () => { setDone(v); await toggleTask(task.id, task.project_id, v); });
        }} />
      <div className="flex-1">
        <p className={done ? "text-muted line-through" : ""}>
          {task.source === "claude" && "✨ "}{task.title}
        </p>
        {task.details && <p className="text-xs text-muted">{task.details}</p>}
      </div>
      {task.due_date && <span className="chip">{new Date(task.due_date).toLocaleDateString("fr-FR")}</span>}
      <button onClick={() => start(() => deleteTask(task.id, task.project_id))}
        className="text-muted opacity-0 transition group-hover:opacity-100" aria-label="Supprimer">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
