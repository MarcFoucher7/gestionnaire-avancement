"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileUp, Link2, Sparkles } from "lucide-react";
import { magicProject, type MagicState } from "@/app/actions";
import { ColorPicker } from "./color-picker";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={pending}>
      <Sparkles size={16} className={pending ? "animate-spin" : ""} />
      {pending ? "Claude lit ton cours et prépare le planning…" : "Créer le projet automatiquement"}
    </button>
  );
}

export function MagicForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState<MagicState, FormData>(magicProject, undefined);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!enabled) {
    return (
      <div className="space-y-2 text-sm">
        <p>Pour activer le projet magique, ajoute ta clé API Claude dans Vercel :</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Crée une clé sur <a className="text-accent underline" href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a> (mets une limite de dépense à 5 €).</li>
          <li>Dans Vercel → Settings → Environment Variables, ajoute <code>ANTHROPIC_API_KEY</code>.</li>
          <li>Redéploie.</li>
        </ol>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">
        Donne-moi ton cours, un sujet ou le lien d&apos;une conversation Claude. Je crée le projet, découpe les révisions
        et les place dans les trous de ton emploi du temps avant l&apos;échéance.
      </p>
      <label className="flex items-center gap-2">
        <Link2 size={16} className="text-muted" />
        <input name="url" type="url" placeholder="Lien : conversation Claude partagée, page du cours, Moodle…" className="input" />
      </label>
      <textarea name="text" rows={6} placeholder="…ou colle le contenu du cours / de la conversation ici" className="input" />
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm text-muted transition hover:border-accent hover:text-accent">
        <FileUp size={18} /> {fileName ?? "Ou dépose un PDF / une photo du cours"}
        <input name="file" type="file" accept=".pdf,image/*,.txt,.md" className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
      </label>
      <input name="hint" placeholder="Précision (ex : éval jeudi 14h, porte sur les chapitres 2 et 3)" className="input" />
      <ColorPicker />
      {state?.error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{state.error}</p>}
      <Submit />
    </form>
  );
}
