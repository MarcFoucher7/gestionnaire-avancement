"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md card space-y-3 p-8 text-center">
      <p className="text-4xl">😵</p>
      <h1 className="text-xl font-semibold">Oups, quelque chose a planté</h1>
      <p className="text-sm text-muted">{error.message.startsWith("Base de données") ? error.message : "Souvent, c'est la base qui n'est pas branchée."}</p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="btn-ghost border border-border">Réessayer</button>
        <Link href="/diagnostic" className="btn-primary">Lancer le diagnostic</Link>
      </div>
    </div>
  );
}
