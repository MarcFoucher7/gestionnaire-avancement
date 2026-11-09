import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Avancement",
  description: "Mes projets, mes révisions, mon temps.",
};

export const viewport: Viewport = { themeColor: "#6366f1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased`}>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:pl-64 md:pr-8">{children}</main>
      </body>
    </html>
  );
}
