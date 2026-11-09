"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { replanMissed } from "@/app/actions";

export function ReplanBanner({ count }: { count: number }) {
  const [pending, start] = useTransition();
  if (!count) return null;
  return (
    <div className="card flex flex-wrap items-center gap-3 border-amber-500/40 bg-amber-500/10 p-4">
      <span className="text-xl">⏰</span>
      <p className="flex-1 text-sm">
        <b>{count} créneau{count > 1 ? "x" : ""} de travail</b> passé{count > 1 ? "s" : ""} sans être validé{count > 1 ? "s" : ""}.
        Je peux les replacer automatiquement dans tes prochains trous libres.
      </p>
      <button className="btn-primary flex items-center gap-2" disabled={pending} onClick={() => start(async () => { await replanMissed(); })}>
        <RefreshCw size={14} className={pending ? "animate-spin" : ""} /> Rattraper
      </button>
    </div>
  );
}
