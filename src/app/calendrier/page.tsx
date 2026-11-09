import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { CalendarView } from "@/components/calendar-view";
import { ReplanBanner } from "@/components/replan-banner";

export default async function CalendrierPage() {
  const supabase = await createClient();
  const [settings, { data: projects }, { count: missed }] = await Promise.all([
    getSettings(supabase),
    supabase.from("projects").select("id,name,emoji,color").neq("status", "termine").order("name"),
    supabase.from("work_sessions").select("id", { count: "exact", head: true }).eq("status", "prevu").lt("ends_at", new Date().toISOString()),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Calendrier</h1>
        <p className="mt-1 text-muted">Tes cours en gris, tes créneaux en couleur. Glisse pour décaler, sélectionne un trou pour ajouter.</p>
      </div>
      {!settings.ics_url && (
        <p className="card p-4 text-sm">📅 Ajoute le lien de ton emploi du temps dans <Link href="/reglages" className="text-accent underline">Réglages</Link> pour voir tes cours ici.</p>
      )}
      <ReplanBanner count={missed ?? 0} />
      <CalendarView projects={projects ?? []} dayStart={settings.day_start} dayEnd={settings.day_end} />
    </div>
  );
}
