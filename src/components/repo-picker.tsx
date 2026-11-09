"use client";

import { useState, useTransition } from "react";
import { Check, GitBranch, Lock, Search } from "lucide-react";
import { getRepos } from "@/app/actions";
import type { Repo } from "@/lib/github";
import { Popover } from "./ui/popover";

/** Choix d'un repo GitHub dans la liste de tes repos (chargée à l'ouverture). */
export function RepoPicker({ name = "github_repo", defaultValue, inline = false }: { name?: string; defaultValue?: string | null; inline?: boolean }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const load = () => { if (!repos) start(async () => setRepos(await getRepos())); };
  const list = (repos ?? []).filter((r) => r.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Popover inline={inline} className="w-full min-w-72" trigger={() => (
      <button type="button" onClick={load} className="input flex items-center gap-2 text-left">
        <GitBranch size={16} className="text-muted" />
        <span className={value ? "" : "text-muted"}>{value || "Lier un repo GitHub"}</span>
        <input type="hidden" name={name} value={value} />
      </button>
    )}>
      {(close) => (
        <div>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-muted" />
            <input autoFocus className="input" placeholder="Chercher ou coller owner/repo" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && q.includes("/")) { e.preventDefault(); setValue(q.replace("https://github.com/", "")); close(); } }} />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {pending && <p className="p-2 text-sm text-muted">Chargement de tes repos…</p>}
            {repos && !repos.length && (
              <p className="p-2 text-sm text-muted">Aucun repo trouvé. Renseigne ton pseudo GitHub dans Réglages, ou tape « owner/repo » puis Entrée.</p>
            )}
            {value && (
              <button type="button" className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-muted hover:bg-bg" onClick={() => { setValue(""); close(); }}>
                Aucun repo
              </button>
            )}
            {list.map((r) => (
              <button key={r.full_name} type="button" onClick={() => { setValue(r.full_name); close(); }}
                className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-bg">
                <span className="mt-0.5 w-4">{value === r.full_name && <Check size={14} />}</span>
                <span className="flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium">{r.name} {r.private && <Lock size={12} className="text-muted" />}</span>
                  {r.description && <span className="line-clamp-1 text-xs text-muted">{r.description}</span>}
                </span>
                {r.language && <span className="chip">{r.language}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}
