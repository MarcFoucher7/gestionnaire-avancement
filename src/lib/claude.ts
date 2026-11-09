import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { paris } from "./time";
import type { Category } from "./types";

export const claudeEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export type MagicPlan = {
  project: { name: string; emoji: string; category: Category; description: string; deadline: string | null };
  tasks: { title: string; details: string; estimated_minutes: number; due_date: string | null; priority: 1 | 2 | 3 }[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["project", "tasks"],
  properties: {
    project: {
      type: "object",
      additionalProperties: false,
      required: ["name", "emoji", "category", "description", "deadline"],
      properties: {
        name: { type: "string", description: "Nom court, ex : « Éval R3.04 – Qualité de dev »" },
        emoji: { type: "string", description: "Un seul emoji qui représente le projet" },
        category: { type: "string", enum: ["eval", "perso", "concours", "stage", "cours", "autre"] },
        description: { type: "string", description: "2 phrases max : le but et ce qui sera évalué" },
        deadline: { type: ["string", "null"], description: "Date-heure locale de l'échéance au format YYYY-MM-DDTHH:mm, ou null" },
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "details", "estimated_minutes", "due_date", "priority"],
        properties: {
          title: { type: "string", description: "Action concrète qui commence par un verbe" },
          details: { type: "string", description: "Ce qu'il faut faire précisément, notions et exercices" },
          estimated_minutes: { type: "integer", description: "Entre 20 et 120" },
          due_date: { type: ["string", "null"], description: "YYYY-MM-DD avant laquelle la faire, ou null" },
          priority: { type: "integer", enum: [1, 2, 3], description: "1 = essentiel pour l'éval" },
        },
      },
    },
  },
} as const;

export type MagicInput = {
  text?: string;
  sourceUrl?: string;
  file?: { name: string; type: string; base64: string };
  hint?: string; // ex : « éval jeudi 14h »
};

/** Envoie le cours (texte, PDF, image ou conversation) à Claude et récupère un projet structuré. */
export async function analyzeWithClaude(input: MagicInput): Promise<MagicPlan> {
  const client = new Anthropic();
  const today = format(paris(new Date()), "EEEE d MMMM yyyy, HH'h'mm", { locale: fr });

  const content: Anthropic.ContentBlockParam[] = [];
  if (input.file?.type === "application/pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.file.base64 } });
  } else if (input.file?.type.startsWith("image/")) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.file.type as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: input.file.base64 },
    });
  }
  content.push({
    type: "text",
    text: [
      `Nous sommes le ${today} (heure de Paris).`,
      input.hint ? `Précision de l'étudiant : ${input.hint}` : "",
      input.sourceUrl ? `Source : ${input.sourceUrl}` : "",
      input.text ? `Contenu :\n<<<\n${input.text.slice(0, 150_000)}\n>>>` : "",
      "",
      "Tu prépares un plan de travail pour un étudiant d'IUT à partir de ce contenu (cours, sujet, ou conversation où il décrit un projet).",
      "1. Crée UN projet : nom, emoji, catégorie, description, échéance (déduis-la du contenu ou de sa précision, sinon null).",
      "2. Découpe le travail en 4 à 15 tâches concrètes de 20 à 120 min : relire une notion, faire une fiche, refaire tel exercice, faire un sujet blanc, coder telle fonctionnalité...",
      "   Ordonne-les de la base vers l'entraînement final. Pour une éval, termine par un entraînement en conditions réelles.",
      "3. Si l'échéance est connue, donne à chaque tâche une due_date pour étaler le travail jusqu'à la veille.",
      "Réponds en français.",
    ].filter(Boolean).join("\n"),
  });

  const msg = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
  });
  const text = msg.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude n'a pas renvoyé de plan.");
  return JSON.parse(text.text) as MagicPlan;
}

/** Récupère le texte d'une page (cours en ligne, conversation Claude partagée...). */
export async function fetchSourceText(url: string): Promise<string> {
  const share = url.match(/claude\.ai\/share\/([\w-]+)/);
  if (share) {
    // Conversation partagée : on tente l'API publique qu'utilise la page de partage
    const res = await fetch(`https://claude.ai/api/chat_snapshots/${share[1]}?rendering_mode=messages&render_all_tools=true`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) avancement-app", Accept: "application/json" },
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      const msgs: { sender?: string; text?: string; content?: { text?: string }[] }[] = data?.chat_messages ?? [];
      const text = msgs
        .map((m) => `${m.sender === "human" ? "Étudiant" : "Claude"} : ${m.text || (m.content ?? []).map((c) => c.text ?? "").join("\n")}`)
        .join("\n\n");
      if (text.trim().length > 50) return text;
    }
    throw new Error("Je n'arrive pas à lire cette conversation Claude (claude.ai bloque les robots). Copie-colle son contenu dans la zone de texte.");
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 avancement-app" } });
  if (!res.ok) throw new Error(`Lien inaccessible (${res.status}).`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
