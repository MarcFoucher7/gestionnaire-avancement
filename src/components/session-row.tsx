"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { setSessionStatus } from "@/app/actions";
import { paris } from "@/lib/time";
import type { WorkSession } from "@/lib/types";

const hm = (s: string | Date) => format(paris(s), "HH:mm");

export function SessionRow({ session, project, compact = false }: { session: WorkSession; project?: { name: string; emoji: string; color: string }; compact?: boolean }) {
  const [pending, start] = useTransition();
  const done = session.status === "fait";
  return (
    <div className={`flex items-center gap-3 rounded-xl border-l-4 bg-bg px-3 py-2 ${pending ? "opacity-50" : ""}`} style={{ borderColor: project?.color ?? "var(--accent)" }}>
      {!compact && <span className="w-24 shrink-0 text-xs tabular-nums text-muted">{hm(session.starts_at)} – {hm(session.ends_at)}</span>}
      <div className="min-w-0 flex-1">
        {compact && <p className="text-xs tabular-nums text-muted">{hm(session.starts_at)} – {hm(session.ends_at)}</p>}
        <p className={`${compact ? "line-clamp-2" : "truncate"} text-sm ${done ? "text-muted line-through" : ""}`}>{session.title ?? "Travail"}</p>
        {project && <p className="truncate text-xs text-muted">{project.emoji} {project.name}</p>}
      </div>
      {session.status === "prevu" && (
        <>
          <button title="Fait" className="btn-ghost !px-2 text-emerald-500" onClick={() => start(() => setSessionStatus(session.id, "fait"))}><Check size={16} /></button>
          <button title="Annuler" className="btn-ghost !px-2" onClick={() => start(() => setSessionStatus(session.id, "annule"))}><X size={16} /></button>
        </>
      )}
      {done && <span className="chip text-emerald-500">fait</span>}
    </div>
  );
}
