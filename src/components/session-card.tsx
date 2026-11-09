"use client";

import { useState } from "react";
import { format } from "date-fns";
import { moveSession, setSessionStatus } from "@/app/actions";
import { paris } from "@/lib/time";
import type { Project, WorkSession } from "@/lib/types";

const hm = (s: string) => format(paris(s), "HH'h'mm");
const local = (s: string) => format(paris(s), "yyyy-MM-dd'T'HH:mm");

export function SessionCard({ session, project }: { session: WorkSession; project?: Pick<Project, "name" | "color"> }) {
  const [moving, setMoving] = useState(false);
  const faded = session.status === "fait" || session.status === "annule";

  return (
    <div className="rounded-xl border-l-4 bg-bg px-3 py-2 text-sm" style={{ borderColor: project?.color ?? "var(--accent)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-muted">{hm(session.starts_at)} – {hm(session.ends_at)}</span>
        <span className={faded ? "text-muted line-through" : ""}>📚 {project?.name ?? "Travail"}</span>
        <div className="ml-auto flex gap-1">
          <button className="btn-ghost" onClick={() => setSessionStatus(session.id, "fait")}>✓ Fait</button>
          <button className="btn-ghost" onClick={() => setMoving((m) => !m)}>↔ Décaler</button>
          <button className="btn-ghost" onClick={() => setSessionStatus(session.id, "annule")}>✕</button>
        </div>
      </div>
      {moving && (
        <form action={moveSession.bind(null, session.id)} onSubmit={() => setMoving(false)} className="mt-2 flex flex-wrap gap-2">
          <input name="starts_at" type="datetime-local" defaultValue={local(session.starts_at)} className="input w-auto" />
          <input name="ends_at" type="datetime-local" defaultValue={local(session.ends_at)} className="input w-auto" />
          <button className="btn-primary">Déplacer</button>
        </form>
      )}
    </div>
  );
}
