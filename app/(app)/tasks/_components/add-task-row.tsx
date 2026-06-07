"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useCreateTask } from "./use-tasks";
import type { ClientProject } from "@/types";

type PriorityValue = "" | "LOW" | "MEDIUM" | "HIGH";

interface AddTaskRowProps {
  projects: ClientProject[];
  defaultProjectId?: string | null;
}

export const AddTaskRow = forwardRef<HTMLInputElement, AddTaskRowProps>(function AddTaskRow(
  { projects, defaultProjectId },
  ref,
) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD from <input type="date">
  const [priority, setPriority] = useState<PriorityValue>("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");
  const [isFocused, setIsFocused] = useState(false);

  const { mutate: createTask, isPending } = useCreateTask();

  const effectiveProjectId = projectId || defaultProjectId || "";
  const showMeta = isFocused || !!title || !!dueDate || !!priority;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask(
      {
        title: trimmed,
        dueDate: dueDate ? new Date(dueDate + "T00:00:00").toISOString() : undefined,
        priority: priority || undefined,
        projectId: effectiveProjectId || undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
          setPriority("");
        },
      },
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white px-4 py-2.5 transition-colors",
        showMeta
          ? "border-zinc-200 shadow-sm"
          : "border-dashed border-zinc-200",
        "focus-within:border-clay-300 focus-within:shadow-sm",
      )}
    >
      {/* Title row */}
      <div className="flex items-center gap-2">
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setTitle("");
              setDueDate("");
              setPriority("");
              (e.target as HTMLInputElement).blur();
            }
          }}
          data-testid="add-task-input"
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>

      {/* Meta row — visible when focused or when any meta field has a value */}
      {showMeta && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-zinc-50 pt-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border-0 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 ring-1 ring-zinc-200 focus:outline-none focus:ring-clay-200"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityValue)}
            className="rounded-lg border-0 bg-zinc-50 py-1 pl-2 pr-6 text-xs text-zinc-500 ring-1 ring-zinc-200 focus:outline-none focus:ring-clay-200"
          >
            <option value="">Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {projects.length > 0 && (
            <select
              value={effectiveProjectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border-0 bg-zinc-50 py-1 pl-2 pr-6 text-xs text-zinc-500 ring-1 ring-zinc-200 focus:outline-none focus:ring-clay-200"
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
      )}
    </div>
  );
});
