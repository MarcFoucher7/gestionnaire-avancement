"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto mt-24 max-w-sm card p-8">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="mt-1 text-sm text-muted">On t&apos;envoie un lien magique par mail.</p>
      {sent ? (
        <p className="mt-6 text-sm">📬 Lien envoyé à <b>{email}</b>, ouvre ta boîte mail.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className="input" type="email" required placeholder="toi@mail.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary w-full">Recevoir le lien</button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      )}
    </div>
  );
}
