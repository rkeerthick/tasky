"use client";

import { useState, forwardRef } from "react";
import { useCreateTask } from "./use-tasks";
import type { ClientProject } from "@/types";

interface AddTaskRowProps {
  projects: ClientProject[];
  defaultProjectId?: string | null;
}

export const AddTaskRow = forwardRef<HTMLInputElement, AddTaskRowProps>(function AddTaskRow(
  { projects, defaultProjectId },
  ref,
) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");
  const { mutate: createTask, isPending } = useCreateTask();

  // Sync defaultProjectId changes (e.g. when user switches project in sidebar)
  const effectiveProjectId = projectId || defaultProjectId || "";

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask(
      { title: trimmed, projectId: effectiveProjectId || undefined },
      { onSuccess: () => setTitle("") },
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-2.5 transition-colors focus-within:border-zinc-400 focus-within:shadow-sm">
      <svg
        className="h-4 w-4 shrink-0 text-zinc-300"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
      </svg>

      <input
        ref={ref}
        type="text"
        placeholder="Add a task…"
        value={title}
        disabled={isPending}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setTitle("");
        }}
        data-testid="add-task-input"
        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
      />

      {projects.length > 0 && (
        <select
          value={effectiveProjectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-md border-0 bg-transparent py-0 text-xs text-zinc-400 focus:ring-0"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
});
