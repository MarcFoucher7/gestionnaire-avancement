import ICAL from "ical.js";
import { paris } from "./time";

export type CourseEvent = { title: string; location: string | null; start: Date; end: Date };

/** Télécharge et lit le calendrier ICS de l'IUT (export ADE par exemple). */
export async function fetchCourses(url: string, from: Date, to: Date): Promise<CourseEvent[]> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ICS inaccessible (${res.status})`);
  const comp = new ICAL.Component(ICAL.parse(await res.text()));
  const events: CourseEvent[] = [];

  for (const v of comp.getAllSubcomponents("vevent")) {
    const ev = new ICAL.Event(v);
    if (ev.isRecurring()) {
      const it = ev.iterator();
      for (let next = it.next(); next && next.toJSDate() < to; next = it.next()) {
        const occ = ev.getOccurrenceDetails(next);
        const start = occ.startDate.toJSDate();
        if (start >= from) events.push({ title: ev.summary, location: ev.location || null, start, end: occ.endDate.toJSDate() });
      }
    } else {
      const start = ev.startDate.toJSDate();
      if (start >= from && start < to) {
        events.push({ title: ev.summary, location: ev.location || null, start, end: ev.endDate.toJSDate() });
      }
    }
  }
  return events.sort((a, b) => +a.start - +b.start);
}

/** Créneaux libres d'une journée (entre dayStart et dayEnd heures), d'au moins minMinutes. */
export function freeSlots(day: Date, busy: { start: Date; end: Date }[], dayStart = 8, dayEnd = 21, minMinutes = 45) {
  const open = paris(day); open.setHours(dayStart, 0, 0, 0);
  const close = paris(day); close.setHours(dayEnd, 0, 0, 0);
  const slots: { start: Date; end: Date }[] = [];
  let cursor: Date = open;
  for (const b of [...busy].sort((a, c) => +a.start - +c.start)) {
    if (b.end <= cursor || b.start >= close) continue;
    if (+b.start - +cursor >= minMinutes * 60_000) slots.push({ start: cursor, end: b.start });
    if (b.end > cursor) cursor = b.end;
  }
  if (+close - +cursor >= minMinutes * 60_000) slots.push({ start: cursor, end: close });
  return slots;
}
