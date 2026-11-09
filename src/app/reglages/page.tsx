import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { claudeEnabled } from "@/lib/claude";
import { saveSettings } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { headers } from "next/headers";

export default async function ReglagesPage() {
  const supabase = await createClient();
  const s = await getSettings(supabase);
  const host = (await headers()).get("host");
  const install = `curl -fsSL https://${host}/install-helper-macos.sh | bash`;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Réglages</h1>

      <form action={saveSettings} className="card space-y-5 p-6">
        <Section title="📅 Emploi du temps IUT" sub="Lien ICS (ADE → Exporter / Synchroniser). Tes cours bloquent le planning automatique.">
          <input name="ics_url" defaultValue={s.ics_url ?? ""} placeholder="https://planning.univ-lemans.fr/…calType=ical…" className="input font-mono text-xs" />
        </Section>

        <Section title="🐙 GitHub" sub="Ton pseudo, pour choisir un repo dans la liste. Ajoute GITHUB_TOKEN dans Vercel pour voir aussi tes repos privés.">
          <input name="github_login" defaultValue={s.github_login ?? ""} placeholder="MarcFoucher7" className="input" />
        </Section>

        <Section title="⏱️ Ma façon de travailler" sub="Le planificateur place les révisions dans ces limites, avec 15 min de pause autour des cours.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Num name="day_start" label="Je commence à" value={s.day_start} suffix="h" min={5} max={14} />
            <Num name="day_end" label="J'arrête à" value={s.day_end} suffix="h" min={15} max={24} />
            <Num name="session_minutes" label="Créneau max" value={s.session_minutes} suffix="min" min={30} max={240} step={15} />
            <Num name="daily_cap" label="Max par jour et par projet" value={s.daily_cap} suffix="min" min={30} max={600} step={15} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="weekends" defaultChecked={s.weekends} className="size-4 accent-[var(--accent)]" /> Je travaille aussi le week-end
          </label>
        </Section>

        <div className="flex justify-end"><button className="btn-primary">Enregistrer</button></div>
      </form>

      <div className="card space-y-3 p-6">
        <h2 className="font-semibold">✨ Claude</h2>
        {claudeEnabled()
          ? <p className="text-sm text-emerald-500">Connecté : le projet magique est actif.</p>
          : <p className="text-sm text-muted">Pas encore activé : ajoute <code>ANTHROPIC_API_KEY</code> dans Vercel → Settings → Environment Variables, puis redéploie.</p>}
      </div>

      <div className="card space-y-3 p-6">
        <h2 className="font-semibold">📁 Helper macOS (Finder)</h2>
        <p className="text-sm text-muted">
          Un navigateur n&apos;a pas le droit d&apos;ouvrir le Finder tout seul. Ce petit helper (une mini app AppleScript) s&apos;en charge :
          le bouton <b>Finder</b> d&apos;un projet ouvre son dossier, et le bouton <b>📁</b> du formulaire ouvre un sélecteur de dossier.
          Colle cette commande une fois dans le Terminal :
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-bg p-3">
          <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs">{install}</code>
          <CopyButton text={install} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-2 text-xs text-muted">{sub}</p>
      {children}
    </div>
  );
}

function Num({ name, label, value, suffix, ...rest }: { name: string; label: string; value: number; suffix: string; min: number; max: number; step?: number }) {
  return (
    <label className="text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input type="number" name={name} defaultValue={value} className="input" {...rest} />
        <span className="text-muted">{suffix}</span>
      </div>
    </label>
  );
}
