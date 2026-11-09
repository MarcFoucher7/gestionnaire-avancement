import { addDays, addMinutes, isWeekend, startOfDay } from "date-fns";
import { paris } from "./time";
import type { Settings } from "./types";

export type Interval = { start: Date; end: Date };
export type PlanTask = { id: string; title: string; minutes: number; due: Date | null; priority: number };
export type PlannedSession = { task_id: string; title: string; start: Date; end: Date };

const QUARTER = 15 * 60_000;
const roundUp = (d: Date) => new Date(Math.ceil(+d / QUARTER) * QUARTER);
const BREAK = 15; // minutes de pause autour d'un cours ou d'un autre créneau
const MIN_SLOT = 30;

/** Trous libres d'une journée (heure de Paris) en tenant compte des créneaux occupés. */
export function freeIntervals(day: Date, busy: Interval[], s: Pick<Settings, "day_start" | "day_end">, notBefore: Date): Interval[] {
  const open = paris(day); open.setHours(s.day_start, 0, 0, 0);
  const close = paris(day); close.setHours(s.day_end, 0, 0, 0);
  let cursor: Date = roundUp(new Date(Math.max(+open, +notBefore)));
  const out: Interval[] = [];
  const sorted = busy
    .map((b) => ({ start: addMinutes(b.start, -BREAK), end: addMinutes(b.end, BREAK) }))
    .filter((b) => b.end > open && b.start < close)
    .sort((a, b) => +a.start - +b.start);
  for (const b of sorted) {
    if (b.start > cursor) out.push({ start: cursor, end: new Date(Math.min(+b.start, +close)) });
    if (b.end > cursor) cursor = roundUp(b.end);
  }
  if (close > cursor) out.push({ start: cursor, end: close });
  return out.filter((i) => +i.end - +i.start >= MIN_SLOT * 60_000);
}

/**
 * Répartit les tâches non faites dans les trous libres entre `now` et l'échéance,
 * en étalant la charge (révisions espacées) et sans dépasser `daily_cap` par jour.
 */
export function planSessions(
  tasks: PlanTask[],
  busy: Interval[],
  settings: Settings,
  now: Date,
  deadline: Date | null,
): { sessions: PlannedSession[]; unplanned: PlanTask[] } {
  const horizon = deadline ?? addDays(now, 14);
  const lastDay = startOfDay(paris(addMinutes(horizon, -1)));
  const days: Date[] = [];
  for (let d = startOfDay(paris(now)); d <= lastDay; d = addDays(d, 1)) {
    const open = paris(d); open.setHours(settings.day_start, 0, 0, 0);
    if (open >= horizon) continue;
    if (settings.weekends || !isWeekend(d)) days.push(d);
  }
  if (!days.length) return { sessions: [], unplanned: tasks };

  const queue = [...tasks].sort(
    (a, b) => (+(a.due ?? horizon) - +(b.due ?? horizon)) || a.priority - b.priority,
  ).map((t) => ({ ...t, left: t.minutes }));

  const taken: Interval[] = [...busy];
  const sessions: PlannedSession[] = [];

  for (const [i, day] of days.entries()) {
    // Étaler : ce qu'il reste / jours restants, arrondi au quart d'heure, borné par daily_cap
    const left = queue.reduce((s, t) => s + t.left, 0);
    let budget = Math.min(settings.daily_cap, Math.max(45, Math.ceil(left / (days.length - i) / 15) * 15));
    const slots = freeIntervals(day, taken, settings, now)
      .map((s) => ({ start: s.start, end: new Date(Math.min(+s.end, +horizon)) }))
      .filter((s) => +s.end - +s.start >= MIN_SLOT * 60_000);
    for (const slot of slots) {
      let cursor = slot.start;
      while (budget >= MIN_SLOT && queue.length) {
        const task = queue.find((t) => !t.due || cursor < t.due);
        if (!task) break;
        const room = (+slot.end - +cursor) / 60_000;
        let len = Math.min(task.left, settings.session_minutes, budget, room);
        // éviter un bout de tâche ridicule (< 30 min) à replacer plus tard
        const rest = task.left - len;
        if (rest > 0 && rest < MIN_SLOT && room >= task.left) len = task.left;
        if (len < MIN_SLOT && len < task.left) break;
        const end = addMinutes(cursor, len);
        sessions.push({ task_id: task.id, title: task.title, start: cursor, end });
        taken.push({ start: cursor, end });
        task.left -= len;
        budget -= len;
        if (task.left <= 0) queue.splice(queue.indexOf(task), 1);
        cursor = addMinutes(end, BREAK);
        if (+slot.end - +cursor < MIN_SLOT * 60_000) break;
      }
      if (budget < MIN_SLOT || !queue.length) break;
    }
    if (!queue.length) break;
  }
  return { sessions, unplanned: queue.filter((t) => t.left > 0) };
}
