"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/app/actions";
import { DatePicker } from "./date-picker";

export function AddTask({ projectId }: { projectId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (f) => { await createTask(projectId, f); ref.current?.reset(); }}
      className="flex flex-wrap items-center gap-2 p-3">
      <Plus size={16} className="ml-1 text-muted" />
      <input name="title" required placeholder="Ajouter une tâche…" className="input min-w-48 flex-1 !border-transparent !bg-transparent" />
      <select name="estimated_minutes" defaultValue="60" className="input w-auto">
        {[20, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} min</option>)}
      </select>
      <select name="priority" defaultValue="2" className="input w-auto">
        <option value="1">🔴 Important</option>
        <option value="2">Normal</option>
        <option value="3">⚪ Bonus</option>
      </select>
      <div className="w-44"><DatePicker name="due_date" withTime={false} placeholder="Pour quand ?" /></div>
      <button className="btn-primary">Ajouter</button>
    </form>
  );
}
