"use client";

import { updateProjectStatus } from "@/app/actions";
import { STATUS_LABEL, type Status } from "@/lib/types";

export function StatusSelect({ id, value }: { id: string; value: Status }) {
  return (
    <select defaultValue={value} className="input w-auto"
      onChange={(e) => updateProjectStatus(id, e.target.value)}>
      {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
