"use client";

import { useState } from "react";
import { COLORS } from "@/lib/types";

export function ColorPicker({ name = "color", defaultValue = COLORS[0] }: { name?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={value} />
      {COLORS.map((c) => (
        <button key={c} type="button" onClick={() => setValue(c)} aria-label={c}
          className={`size-7 rounded-full transition hover:scale-110 ${value === c ? "ring-2 ring-offset-2 ring-offset-surface" : ""}`}
          style={{ background: c, ["--tw-ring-color" as string]: c }} />
      ))}
    </div>
  );
}
