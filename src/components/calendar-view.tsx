"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Trash2, X } from "lucide-react";
import { createSession, deleteSession, getCalendarEvents, moveSession, setSessionStatus, type CalEvent } from "@/app/actions";
import { Modal } from "./ui/modal";

type P = { id: string; name: string; emoji: string; color: string };

export function CalendarView({ projects, dayStart, dayEnd }: { projects: P[]; dayStart: number; dayEnd: number }) {
  const cal = useRef<FullCalendar>(null);
  const [selection, setSelection] = useState<{ start: Date; end: Date } | null>(null);
  const [clicked, setClicked] = useState<CalEvent | null>(null);
  const [mobile, setMobile] = useState(false);
  const [, start] = useTransition();
  const refetch = () => cal.current?.getApi().refetchEvents();

  useEffect(() => setMobile(window.innerWidth < 768), []);

  const toEvent = (e: CalEvent): EventInput =>
    e.kind === "course"
      ? { id: e.id, title: `🎓 ${e.title}${e.location ? ` · ${e.location}` : ""}`, start: e.start, end: e.end, editable: false,
          classNames: ["course"], backgroundColor: "var(--bg)", borderColor: "var(--border)", textColor: "var(--muted)", extendedProps: e }
      : { id: e.id, title: e.title, start: e.start, end: e.end, editable: true, backgroundColor: e.status === "fait" ? `${e.color}66` : e.color,
          borderColor: e.color, textColor: "#fff", extendedProps: e, classNames: e.status === "fait" ? ["line-through"] : [] };

  const onMove = (arg: EventDropArg | EventResizeDoneArg) =>
    start(async () => { await moveSession(arg.event.id, arg.event.start!.toISOString(), arg.event.end!.toISOString()); });

  return (
    <div className="card p-3 sm:p-5">
      <FullCalendar
        ref={cal}
        key={mobile ? "m" : "d"}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        locale={frLocale}
        initialView={mobile ? "timeGridDay" : "timeGridWeek"}
        headerToolbar={{ left: "prev,next today", center: "title", right: mobile ? "timeGridDay,timeGridWeek" : "dayGridMonth,timeGridWeek,timeGridDay" }}
        firstDay={1}
        height="auto"
        allDaySlot={false}
        nowIndicator
        slotMinTime={`${String(Math.max(0, dayStart - 1)).padStart(2, "0")}:00:00`}
        slotMaxTime={`${String(Math.min(24, dayEnd + 1)).padStart(2, "0")}:00:00`}
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        selectable
        selectMirror
        editable
        eventResizableFromStart
        events={async (info: { start: Date; end: Date }) => (await getCalendarEvents(info.start.toISOString(), info.end.toISOString())).map(toEvent)}
        select={(s: DateSelectArg) => setSelection({ start: s.start, end: s.end })}
        eventClick={(e: EventClickArg) => {
          const p = e.event.extendedProps as CalEvent;
          if (p.kind === "session") setClicked(p);
        }}
        eventDrop={onMove}
        eventResize={onMove}
      />

      <Modal open={!!selection} onClose={() => setSelection(null)} title="Nouveau créneau de travail">
        {selection && (
          <form className="space-y-4" action={async (f) => {
            await createSession({
              project_id: String(f.get("project_id")),
              title: String(f.get("title") || "") || null,
              starts_at: selection.start.toISOString(),
              ends_at: selection.end.toISOString(),
            });
            setSelection(null);
            refetch();
          }}>
            <p className="text-sm capitalize text-muted">
              {format(selection.start, "EEEE d MMMM, HH:mm", { locale: fr })} – {format(selection.end, "HH:mm")}
            </p>
            <select name="project_id" required className="input">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
            <input name="title" placeholder="Quoi ? (ex : fiche chapitre 3)" className="input" />
            <button className="btn-primary w-full">Ajouter</button>
          </form>
        )}
      </Modal>

      <Modal open={!!clicked} onClose={() => setClicked(null)} title={clicked?.title ?? ""}>
        {clicked && (
          <div className="space-y-4">
            <p className="text-sm capitalize text-muted">
              {format(new Date(clicked.start), "EEEE d MMMM, HH:mm", { locale: fr })} – {format(new Date(clicked.end), "HH:mm")}
            </p>
            <p className="text-xs text-muted">Astuce : glisse le créneau dans le calendrier pour le décaler, tire son bord pour changer sa durée.</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="btn-primary flex items-center justify-center gap-1 !bg-emerald-500" onClick={async () => { await setSessionStatus(clicked.id, "fait"); setClicked(null); refetch(); }}>
                <Check size={16} /> Fait
              </button>
              <button className="btn-ghost flex items-center justify-center gap-1 border border-border" onClick={async () => { await setSessionStatus(clicked.id, "annule"); setClicked(null); refetch(); }}>
                <X size={16} /> Annuler
              </button>
              <button className="btn-ghost flex items-center justify-center gap-1 border border-border text-red-500" onClick={async () => { await deleteSession(clicked.id); setClicked(null); refetch(); }}>
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
            {clicked.projectId && <Link href={`/projets/${clicked.projectId}`} className="block text-center text-sm text-accent">Ouvrir le projet →</Link>}
          </div>
        )}
      </Modal>
    </div>
  );
}
