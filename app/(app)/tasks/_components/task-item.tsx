"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";

type PriorityValue = "" | "LOW" | "MEDIUM" | "HIGH";

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // en-CA locale gives YYYY-MM-DD which is what <input type="date"> expects
  return d.toLocaleDateString("en-CA");
}
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useUpdateTask, useToggleTask, useDeleteTask } from "./use-tasks";
import type { ClientTask, ClientProject, Priority } from "@/types";

// ─── Icons ────────────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="5.5" cy="4" r="1.2" /><circle cx="10.5" cy="4" r="1.2" />
      <circle cx="5.5" cy="8" r="1.2" /><circle cx="10.5" cy="8" r="1.2" />
      <circle cx="5.5" cy="12" r="1.2" /><circle cx="10.5" cy="12" r="1.2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M6.5 1h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1ZM3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2.5 1a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5Zm3 0a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5Z" />
    </svg>
  );
}

// ─── Due date ─────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): { text: string; cls: string } {
  const due = new Date(iso);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / 86_400_000);

  if (diff < 0) return { text: `${Math.abs(diff)}d late`, cls: "text-red-500" };
  if (diff === 0) return { text: "Today", cls: "text-amber-500 font-medium" };
  if (diff === 1) return { text: "Tomorrow", cls: "text-sky-500" };
  if (diff < 7) return { text: `${diff}d`, cls: "text-zinc-400" };
  return {
    text: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cls: "text-zinc-400",
  };
}

// ─── Priority badge ───────────────────────────────────────────────────────────

const PRIORITY: Record<Priority, { label: string; dot: string; text: string }> = {
  HIGH: { label: "High", dot: "bg-red-500", text: "text-red-500" },
  MEDIUM: { label: "Med", dot: "bg-amber-400", text: "text-amber-500" },
  LOW: { label: "Low", dot: "bg-sky-400", text: "text-sky-400" },
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY[priority];
  return (
    <span className={cn("flex items-center gap-1 text-xs", cfg.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: ClientTask;
  project?: ClientProject;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showDragHandle?: boolean;
}

export function TaskItem({ task, project, isSelected, onSelect, showDragHandle = true }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes ?? "");
  const [editDueDate, setEditDueDate] = useState(toDateInputValue(task.dueDate));
  const [editPriority, setEditPriority] = useState<PriorityValue>(task.priority ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  const { mutate: updateTask } = useUpdateTask();
  const { mutate: toggleTask } = useToggleTask();
  const { mutate: deleteTask } = useDeleteTask();

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title);
      setEditNotes(task.notes ?? "");
      setEditDueDate(toDateInputValue(task.dueDate));
      setEditPriority(task.priority ?? "");
    }
  }, [task.title, task.notes, task.dueDate, task.priority, isEditing]);

  function openEdit() {
    setEditTitle(task.title);
    setEditNotes(task.notes ?? "");
    setEditDueDate(toDateInputValue(task.dueDate));
    setEditPriority(task.priority ?? "");
    setIsEditing(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function saveEdit() {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditTitle(task.title);
      setIsEditing(false);
      return;
    }
    const newDueDate = editDueDate
      ? new Date(editDueDate + "T00:00:00").toISOString()
      : null;
    const changed =
      trimmed !== task.title ||
      editNotes !== (task.notes ?? "") ||
      newDueDate !== task.dueDate ||
      (editPriority || null) !== task.priority;
    if (changed) {
      updateTask({
        id: task.id,
        title: trimmed,
        notes: editNotes.trim() || null,
        dueDate: newDueDate,
        priority: editPriority || null,
      });
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditTitle(task.title);
    setEditNotes(task.notes ?? "");
    setEditDueDate(toDateInputValue(task.dueDate));
    setEditPriority(task.priority ?? "");
    setIsEditing(false);
  }

  const done = task.status === "DONE";
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  // Shared drag handle button props
  const dragHandleProps = {
    ...listeners,
    ...attributes,
    tabIndex: -1 as const,
    "aria-label": "Drag to reorder",
    className:
      "cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing" +
      // Expand touch target without changing visual size (negative-margin trick)
      " -m-1 p-1",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="task-item"
      tabIndex={0}
      onFocus={() => onSelect?.(task.id)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, select, textarea, input")) return;
        onSelect?.(task.id);
      }}
      className={cn(
        "group relative rounded-xl border bg-white px-3 py-2.5 shadow-xs transition-shadow focus:outline-none",
        isDragging
          ? "z-50 border-zinc-300 shadow-lg opacity-90"
          : isSelected
            ? "border-zinc-300 ring-2 ring-zinc-200"
            : "border-zinc-100 hover:border-zinc-200 hover:shadow-sm",
        done && !isEditing && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        {/* Desktop drag handle — left side, hidden on mobile */}
        {showDragHandle && (
          <button {...dragHandleProps} className={cn(dragHandleProps.className, "hidden sm:block")}>
            <GripIcon />
          </button>
        )}

        {/* Checkbox — 44 × 44 touch target via negative margin + padding */}
        <button
          onClick={() => toggleTask(task.id)}
          className="-m-2 shrink-0 p-2 text-zinc-300 hover:text-zinc-500"
          aria-label={done ? "Mark as to do" : "Mark as done"}
        >
          {done ? (
            <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="10" cy="10" r="8" />
            </svg>
          )}
        </button>

        {/* Content area */}
        <div className="min-w-0 flex-1 py-0.5">
          {isEditing ? (
            <>
              <input
                ref={titleRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") cancelEdit();
                }}
                // text-base (16px) prevents iOS Safari from zooming
                className="w-full bg-transparent text-base font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="Task title…"
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                placeholder="Add notes…"
                rows={2}
                className="mt-1 w-full resize-none bg-transparent text-sm text-zinc-500 outline-none placeholder:text-zinc-300"
              />

              {/* Due date + priority */}
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="rounded-lg border-0 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 ring-1 ring-zinc-200 focus:outline-none focus:ring-zinc-300"
                />
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as PriorityValue)}
                  className="rounded-lg border-0 bg-zinc-50 py-1 pl-2 pr-6 text-xs text-zinc-500 ring-1 ring-zinc-200 focus:outline-none focus:ring-zinc-300"
                >
                  <option value="">Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  onMouseDown={(e) => { e.preventDefault(); saveEdit(); }}
                  className="-mx-1 rounded-md px-1 py-1 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  Save
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                  className="-mx-1 rounded-md px-1 py-1 text-sm text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p
                role="button"
                tabIndex={0}
                onClick={openEdit}
                onKeyDown={(e) => e.key === "Enter" && openEdit()}
                className={cn(
                  "cursor-text text-sm font-medium leading-snug text-zinc-900",
                  done && "text-zinc-400 line-through",
                )}
              >
                {task.title}
              </p>
              {task.notes && (
                <p
                  onClick={openEdit}
                  className="mt-0.5 line-clamp-2 cursor-text text-xs leading-relaxed text-zinc-400"
                >
                  {task.notes}
                </p>
              )}

              {/* Meta row */}
              {(task.priority ?? dueInfo ?? project) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  {task.priority && <PriorityBadge priority={task.priority} />}
                  {dueInfo && (
                    <span className={cn("text-xs", dueInfo.cls)}>{dueInfo.text}</span>
                  )}
                  {project && (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right-side actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Mobile drag handle — right side */}
          {showDragHandle && (
            <button {...dragHandleProps} className={cn(dragHandleProps.className, "sm:hidden")}>
              <GripIcon />
            </button>
          )}

          {/* Delete — always slightly visible on touch devices (no hover);
              fades in on hover for mouse users */}
          <button
            onClick={() => deleteTask(task.id)}
            className="-m-1 p-1 text-zinc-300 opacity-30 transition-opacity hover:text-red-400 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 sm:opacity-0"
            aria-label="Delete task"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
