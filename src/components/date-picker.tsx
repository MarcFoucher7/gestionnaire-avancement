"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { fr } from "react-day-picker/locale";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import "react-day-picker/style.css";
import { Popover } from "./ui/popover";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Sélecteur de date avec un vrai calendrier (+ heure en option).
 * Envoie "YYYY-MM-DDTHH:mm" (withTime) ou "YYYY-MM-DD" dans un champ caché.
 */
export function DatePicker({ name, defaultValue, withTime = true, placeholder = "Choisir une date", inline = false }: {
  name: string; defaultValue?: string | null; withTime?: boolean; placeholder?: string; inline?: boolean;
}) {
  const init = defaultValue ? new Date(defaultValue) : undefined;
  const [day, setDay] = useState<Date | undefined>(init);
  const [time, setTime] = useState(init && withTime ? `${pad(init.getHours())}:${pad(init.getMinutes())}` : "08:00");

  const value = day
    ? `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}${withTime ? `T${time}` : ""}`
    : "";
  const quick = [
    { label: "Demain", d: 1 }, { label: "Dans 3 j", d: 3 }, { label: "Dans 1 sem.", d: 7 }, { label: "Dans 1 mois", d: 30 },
  ];

  return (
    <Popover inline={inline} className="w-[320px]" trigger={() => (
      <button type="button" className="input flex items-center gap-2 text-left">
        <CalendarDays size={16} className="text-muted" />
        <span className={day ? "" : "text-muted"}>
          {day ? format(day, withTime ? "EEE d MMM yyyy" : "EEE d MMM yyyy", { locale: frLocale }) + (withTime ? ` · ${time}` : "") : placeholder}
        </span>
        {day && (
          <span role="button" className="ml-auto text-muted hover:text-text" onClick={(e) => { e.stopPropagation(); setDay(undefined); }}>
            <X size={14} />
          </span>
        )}
        <input type="hidden" name={name} value={value} />
      </button>
    )}>
      {(close) => (
        <div className="rdp-avancement">
          <div className="mb-2 flex flex-wrap gap-1">
            {quick.map((q) => (
              <button key={q.label} type="button" className="chip hover:border-accent hover:text-accent"
                onClick={() => { const d = new Date(); d.setDate(d.getDate() + q.d); setDay(d); }}>{q.label}</button>
            ))}
          </div>
          <DayPicker mode="single" locale={fr} weekStartsOn={1} selected={day} onSelect={setDay} showOutsideDays />
          <div className="mt-2 flex items-center gap-2">
            {withTime && <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input w-32" step={900} />}
            <button type="button" className="btn-primary ml-auto" onClick={close}>OK</button>
          </div>
        </div>
      )}
    </Popover>
  );
}
