"use client";

import { useState } from "react";
import { Popover } from "./ui/popover";

const EMOJIS = [
  "📝", "📚", "🧠", "📐", "🧮", "🔬", "🧪", "💻", "🖥️", "📱", "🌐", "🗄️",
  "🔐", "🤖", "🎮", "🎨", "🎬", "📊", "📈", "💼", "🏆", "🎯", "🚀", "⚡",
  "🔥", "⭐", "💡", "🛠️", "⚙️", "📦", "🗂️", "📁", "🇬🇧", "🗣️", "✍️", "🎓",
  "🏫", "📅", "⏰", "✅", "🧩", "🌱", "🏃", "🎵", "📷", "✈️", "🏠", "❤️",
];

export function EmojiPicker({ name = "emoji", defaultValue = "📁", inline = false }: { name?: string; defaultValue?: string; inline?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Popover inline={inline} className="w-72" trigger={() => (
      <button type="button" title="Choisir un emoji"
        className="grid size-14 place-items-center rounded-2xl border border-border bg-bg text-3xl transition hover:scale-105">
        {value}
        <input type="hidden" name={name} value={value} />
      </button>
    )}>
      {(close) => (
        <div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => { setValue(e); close(); }}
                className={`rounded-lg p-1 text-xl transition hover:bg-bg ${e === value ? "bg-bg ring-2 ring-accent" : ""}`}>{e}</button>
            ))}
          </div>
          <input className="input mt-2" placeholder="ou colle n'importe quel emoji"
            onChange={(e) => e.target.value && setValue([...e.target.value].slice(-1).join(""))} />
        </div>
      )}
    </Popover>
  );
}
