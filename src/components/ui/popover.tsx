"use client";

import { useEffect, useRef, useState } from "react";

/** Petit popover : un déclencheur, un panneau qui se ferme au clic dehors ou sur Échap. */
export function Popover({ trigger, children, align = "left", className = "", inline = false }: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  /** dans une modale : le panneau s'insère dans le flux au lieu de flotter (sinon il est coupé) */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div className={inline ? `card mt-2 p-3 ${className}` : `absolute z-30 mt-2 ${align === "right" ? "right-0" : "left-0"} card p-3 shadow-xl ${className}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
