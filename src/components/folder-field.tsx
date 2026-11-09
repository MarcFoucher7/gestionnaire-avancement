"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen, HelpCircle } from "lucide-react";

/**
 * Champ « dossier du Mac ».
 * 📁 ouvre le sélecteur de dossier du Finder via le helper macOS (avancement://pick),
 * qui copie le chemin choisi ; on le relit dans le presse-papiers au retour sur la page.
 * On peut aussi glisser un dossier depuis le Finder ou coller le chemin (⌥⌘C dans le Finder).
 */
export function FolderField({ name = "folder_path", defaultValue }: { name?: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [help, setHelp] = useState(false);
  const waiting = useRef(false);

  useEffect(() => {
    const onFocus = async () => {
      if (!waiting.current) return;
      waiting.current = false;
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (text.startsWith("/")) setValue(text);
      } catch {
        setHelp(true);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function onDrop(e: React.DragEvent<HTMLInputElement>) {
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (uri.startsWith("file://")) {
      e.preventDefault();
      setValue(decodeURIComponent(new URL(uri).pathname).replace(/\/$/, ""));
    } else if (e.dataTransfer.files.length) {
      e.preventDefault();
      setHelp(true);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} onDrop={onDrop}
          placeholder="/Users/foucher/BUT/R3.04" className="input font-mono text-xs" />
        <button type="button" title="Choisir dans le Finder" className="btn-ghost border border-border text-lg"
          onClick={() => { waiting.current = true; window.location.href = "avancement://pick"; }}>
          📁
        </button>
        <button type="button" className="btn-ghost" onClick={() => setHelp((h) => !h)} aria-label="Aide"><HelpCircle size={16} /></button>
      </div>
      {help && (
        <div className="mt-2 rounded-xl bg-bg p-3 text-xs text-muted">
          <p className="flex items-center gap-1 font-medium text-text"><FolderOpen size={14} /> Trois façons de lier un dossier :</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>Clique sur 📁 : le Finder s&apos;ouvre, choisis le dossier, reviens ici (il faut le helper macOS, voir Réglages).</li>
            <li>Dans le Finder, sélectionne le dossier, fais <kbd>⌥ ⌘ C</kbd> (copier le chemin) et colle-le ici.</li>
            <li>Glisse le dossier depuis le Finder sur ce champ (marche dans Safari).</li>
          </ol>
        </div>
      )}
    </div>
  );
}
