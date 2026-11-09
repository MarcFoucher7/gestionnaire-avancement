"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { createProject } from "@/app/actions";
import { Modal } from "./ui/modal";
import { ProjectForm } from "./project-form";
import { MagicForm } from "./magic-form";

export function NewProjectButtons({ claude }: { claude: boolean }) {
  const [open, setOpen] = useState<null | "magic" | "manual">(null);
  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setOpen("magic")} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500">
          <Sparkles size={16} /> Projet magique
        </button>
        <button onClick={() => setOpen("manual")} className="btn-ghost flex items-center gap-2 border border-border">
          <Plus size={16} /> Nouveau
        </button>
      </div>
      <Modal open={open === "magic"} onClose={() => setOpen(null)} title="✨ Projet magique" wide>
        <MagicForm enabled={claude} />
      </Modal>
      <Modal open={open === "manual"} onClose={() => setOpen(null)} title="Nouveau projet" wide>
        <ProjectForm action={createProject} />
      </Modal>
    </>
  );
}
