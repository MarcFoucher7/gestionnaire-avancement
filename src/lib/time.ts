import { TZDate } from "@date-fns/tz";

/** Tout s'affiche à l'heure de Paris, même si le serveur (Vercel) tourne en UTC. */
export const TZ = "Europe/Paris";

export const paris = (d: Date | string | number) => new TZDate(new Date(d).getTime(), TZ);

/** "2026-11-12T14:00" (champ datetime-local, heure de Paris) → ISO UTC. */
export function fromLocalInput(value: string | null): string | null {
  if (!value) return null;
  const [date, time = "00:00"] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new TZDate(y, m - 1, d, h, min, TZ).toISOString();
}
