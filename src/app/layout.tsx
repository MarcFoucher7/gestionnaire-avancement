import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { CalendarDays, LayoutGrid, NotebookPen } from "lucide-react";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Avancement",
  description: "Mes projets, mes tâches, mon temps.",
};

const NAV = [
  { href: "/", label: "Projets", icon: LayoutGrid },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: NotebookPen },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased`}>
        <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
            <span className="mr-4 font-semibold">◐ Avancement</span>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="btn-ghost flex items-center gap-1.5">
                <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
