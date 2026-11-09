"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, NotebookPen, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/reglages", label: "Réglages", icon: Settings },
];

export function Nav() {
  const path = usePathname();
  if (path.startsWith("/login")) return null;
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/projets") : path.startsWith(href));
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border bg-surface/60 p-4 backdrop-blur md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">◐</span>
          Avancement
        </Link>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active(href) ? "bg-accent/10 font-medium text-accent" : "text-muted hover:bg-bg hover:text-text"}`}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface/90 py-2 backdrop-blur md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-3 text-[11px] ${active(href) ? "text-accent" : "text-muted"}`}>
            <Icon size={20} /> {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
