import { createClient as createSb } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string; fix?: string };

/** Page de diagnostic : accessible sans être connecté, ne montre aucune clé. */
export default async function DiagnosticPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const checks: Check[] = [];

  checks.push({
    label: "Variable NEXT_PUBLIC_SUPABASE_URL",
    ok: !!url && /^https:\/\/\w+\.supabase\.co\/?$/.test(url),
    detail: url ? url : "absente",
    fix: "Vercel → ton projet → Settings → Environment Variables : https://aunjmjjrtxrhpumqfopo.supabase.co (sans /rest/v1/), puis Deployments → Redeploy.",
  });
  checks.push({
    label: "Variable NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: !!key && key.length > 30,
    detail: key ? `présente (${key.slice(0, 14)}…, ${key.length} caractères)` : "absente",
    fix: "Ajoute la clé publishable / anon dans Vercel, puis Redeploy (les variables NEXT_PUBLIC ne sont lues qu'au build).",
  });

  if (url && key) {
    const sb = createSb(url, key, { auth: { persistSession: false } });
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: key }, cache: "no-store" });
      checks.push({
        label: "Supabase répond et accepte la clé",
        ok: res.ok,
        detail: `HTTP ${res.status}`,
        fix: res.status === 401 ? "La clé ne correspond pas à ce projet : recopie la clé publishable / anon." : "Vérifie l'URL du projet.",
      });
    } catch (e) {
      checks.push({ label: "Supabase répond", ok: false, detail: (e as Error).message, fix: "Vérifie l'URL du projet." });
    }

    for (const [table, cols, file] of [
      ["projects", "id", "0001_init.sql"],
      ["tasks", "id", "0001_init.sql"],
      ["work_sessions", "id", "0001_init.sql"],
      ["journal_entries", "id", "0001_init.sql"],
      ["settings", "user_id", "0001_init.sql"],
      ["projects", "emoji,github_repo", "0002_v2.sql"],
      ["settings", "day_start,github_login", "0002_v2.sql"],
    ] as const) {
      const { error } = await sb.from(table).select(cols).limit(1);
      checks.push({
        label: `Table ${table} (${cols})`,
        ok: !error,
        detail: error ? error.message : "OK",
        fix: `Exécute ${file} dans Supabase → SQL Editor.`,
      });
    }

    // Session de l'utilisateur
    const store = await cookies();
    const server = createServerClient(url, key, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
    const { data: { user } } = await server.auth.getUser();
    checks.push({
      label: "Connecté",
      ok: !!user,
      detail: user ? user.email ?? user.id : "non connecté dans ce navigateur",
      fix: "Va sur /login. Si le lien du mail ne marche pas : Supabase → Authentication → URL Configuration, mets l'adresse de l'app en Site URL et ajoute https://<app>.vercel.app/** en Redirect URL.",
    });
    if (user) {
      const { count, error } = await server.from("projects").select("id", { count: "exact", head: true });
      checks.push({ label: "Lecture de tes projets", ok: !error, detail: error ? error.message : `${count ?? 0} projet(s)` });
    }
  }

  const allOk = checks.every((c) => c.ok);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Diagnostic</h1>
      <p className={allOk ? "text-emerald-500" : "text-amber-500"}>{allOk ? "✅ Tout est branché." : "⚠️ Quelque chose manque, voir ci-dessous."}</p>
      <ul className="card divide-y divide-border">
        {checks.map((c, i) => (
          <li key={i} className="px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium">{c.ok ? "✅" : "❌"} {c.label}</p>
            <p className="ml-7 break-all text-xs text-muted">{c.detail}</p>
            {!c.ok && c.fix && <p className="ml-7 mt-1 text-xs text-amber-500">→ {c.fix}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
