"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCreateProject, useUpdateProject, useDeleteProject } from "./use-projects";
import type { ClientTask, ClientProject } from "@/types";

export type ViewMode = "all" | "today" | "upcoming" | "no-date";

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
];

// ─── View-mode helpers ────────────────────────────────────────────────────────

export function applyViewFilter(tasks: ClientTask[], viewMode: ViewMode): ClientTask[] {
  if (viewMode === "all") return tasks;

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const sevenDaysEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

  switch (viewMode) {
    case "today":
      return tasks.filter((t) => t.dueDate && new Date(t.dueDate) <= todayEnd);
    case "upcoming":
      return tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) >= tomorrowStart && new Date(t.dueDate) <= sevenDaysEnd,
      );
    case "no-date":
      return tasks.filter((t) => !t.dueDate);
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function InboxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2Zm0 1.5h12a.5.5 0 0 1 .5.5v5.5H11a1 1 0 0 0-1 1 1 1 0 0 1-2 0 1 1 0 0 0-1-1H2.5V4a.5.5 0 0 1 .5-.5Zm-.5 8V10h2.5a2.5 2.5 0 0 0 4.998 0H11.5v1.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0Zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13Zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5ZM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8Zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0Zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0Zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707ZM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5ZM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1Z" />
    </svg>
  );
}

function NoDateIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  );
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-4 w-4 rounded-full transition-transform hover:scale-110",
            value === c && "ring-2 ring-offset-1 ring-zinc-400",
          )}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

// ─── Inline create form ───────────────────────────────────────────────────────

function CreateProjectForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: createProject, isPending } = useCreateProject();

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProject({ name: trimmed, color }, { onSuccess: onDone, onError: onDone });
  }

  return (
    <div className="space-y-2 rounded-lg bg-zinc-50 px-2.5 py-2 ring-1 ring-zinc-200">
      <ColorPicker value={color} onChange={setColor} />
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); submit(); }
          if (e.key === "Escape") onDone();
        }}
        placeholder="Project name…"
        disabled={isPending}
        className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isPending || !name.trim()}
          className="text-xs font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-40"
        >
          Create
        </button>
        <button onClick={onDone} className="text-xs text-zinc-400 hover:text-zinc-600">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Inline rename form ───────────────────────────────────────────────────────

function RenameProjectForm({
  project,
  onDone,
}: {
  project: ClientProject;
  onDone: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateProject, isPending } = useUpdateProject();

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { onDone(); return; }
    updateProject({ id: project.id, name: trimmed, color }, { onSuccess: onDone, onError: onDone });
  }

  return (
    <div className="space-y-2 rounded-lg bg-zinc-50 px-2.5 py-2 ring-1 ring-zinc-200">
      <ColorPicker value={color} onChange={setColor} />
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); submit(); }
          if (e.key === "Escape") onDone();
        }}
        disabled={isPending}
        className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isPending || !name.trim()}
          className="text-xs font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-40"
        >
          Save
        </button>
        <button onClick={onDone} className="text-xs text-zinc-400 hover:text-zinc-600">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  count?: number;
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function NavItem({ label, icon, count, active, onClick, onEdit, onDelete }: NavItemProps) {
  return (
    <div className="group flex items-center">
      <button
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
          active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        )}
      >
        <span className={cn("shrink-0", active ? "text-white" : "text-zinc-400")}>{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {count != null && count > 0 && (
          <span className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
            active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500",
          )}>
            {count}
          </span>
        )}
      </button>

      {/* Edit / delete — visible on hover for project items */}
      {(onEdit || onDelete) && (
        <div className="ml-0.5 flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded p-1 text-zinc-400 hover:text-zinc-700"
              aria-label="Rename project"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1 text-zinc-400 hover:text-red-500"
              aria-label="Delete project"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1ZM3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm2.5 1a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5Zm3 0a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5Z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProjectSidebar ───────────────────────────────────────────────────────────

interface ProjectSidebarProps {
  tasks: ClientTask[];
  projects: ClientProject[];
  viewMode: ViewMode;
  projectFilter: string | null;
  onViewMode: (v: ViewMode) => void;
  onProjectFilter: (v: string | null) => void;
}

export function ProjectSidebar({
  tasks,
  projects,
  viewMode,
  projectFilter,
  onViewMode,
  onProjectFilter,
}: ProjectSidebarProps) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { mutate: deleteProject } = useDeleteProject();

  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const counts = {
    all: todoTasks.length,
    today: applyViewFilter(todoTasks, "today").length,
    upcoming: applyViewFilter(todoTasks, "upcoming").length,
    noDate: applyViewFilter(todoTasks, "no-date").length,
  };
  const projectCounts = new Map(
    projects.map((p) => [p.id, todoTasks.filter((t) => t.projectId === p.id).length]),
  );

  const viewNav = (
    <>
      <NavItem label="All tasks" icon={<InboxIcon />} count={counts.all}
        active={viewMode === "all" && projectFilter === null}
        onClick={() => { onViewMode("all"); onProjectFilter(null); }} />
      <NavItem label="Today" icon={<SunIcon />} count={counts.today}
        active={viewMode === "today"}
        onClick={() => { onViewMode("today"); onProjectFilter(null); }} />
      <NavItem label="Upcoming" icon={<CalendarIcon />} count={counts.upcoming}
        active={viewMode === "upcoming"}
        onClick={() => { onViewMode("upcoming"); onProjectFilter(null); }} />
      <NavItem label="No date" icon={<NoDateIcon />} count={counts.noDate}
        active={viewMode === "no-date"}
        onClick={() => { onViewMode("no-date"); onProjectFilter(null); }} />
    </>
  );

  return (
    <>
      {/* ── Desktop: vertical sidebar ── */}
      <aside className="hidden w-44 shrink-0 sm:block">
        <nav className="space-y-0.5">
          {viewNav}

          {/* Projects section */}
          <div className="my-1 border-t border-zinc-100" />
          <div className="flex items-center justify-between px-2.5 pb-0.5 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Projects</p>
            <button
              onClick={() => { setCreating(true); setEditingId(null); }}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700"
              aria-label="New project"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
              </svg>
            </button>
          </div>

          {projects.map((p) =>
            editingId === p.id ? (
              <RenameProjectForm key={p.id} project={p} onDone={() => setEditingId(null)} />
            ) : (
              <NavItem
                key={p.id}
                label={p.name}
                count={projectCounts.get(p.id)}
                active={projectFilter === p.id}
                icon={<span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />}
                onClick={() => { onViewMode("all"); onProjectFilter(p.id); }}
                onEdit={() => { setEditingId(p.id); setCreating(false); }}
                onDelete={() => deleteProject(p.id)}
              />
            ),
          )}

          {creating && <CreateProjectForm onDone={() => setCreating(false)} />}

          {projects.length === 0 && !creating && (
            <p className="px-2.5 py-1 text-xs text-zinc-400">No projects yet</p>
          )}
        </nav>
      </aside>

      {/* ── Mobile: horizontal scrolling pills ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden" role="navigation">
        {(
          [
            { mode: "all" as ViewMode, label: "All", count: counts.all },
            { mode: "today" as ViewMode, label: "Today", count: counts.today },
            { mode: "upcoming" as ViewMode, label: "Upcoming", count: counts.upcoming },
            { mode: "no-date" as ViewMode, label: "No date", count: counts.noDate },
          ] as const
        ).map(({ mode, label, count }) => {
          const isActive = viewMode === mode && (mode !== "all" || projectFilter === null);
          return (
            <button
              key={mode}
              onClick={() => { onViewMode(mode); onProjectFilter(null); }}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 ring-1 ring-zinc-200",
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn("rounded-full px-1 text-xs", isActive ? "text-white/70" : "text-zinc-400")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {projects.map((p) => {
          const isActive = projectFilter === p.id;
          const count = projectCounts.get(p.id) ?? 0;
          return (
            <button
              key={p.id}
              onClick={() => { onViewMode("all"); onProjectFilter(p.id); }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 ring-1 ring-zinc-200",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              {p.name}
              {count > 0 && (
                <span className={cn("text-xs", isActive ? "text-white/70" : "text-zinc-400")}>{count}</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setCreating(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-dashed ring-zinc-200"
        >
          + Project
        </button>

        {/* Mobile create form — rendered below pills when active */}
      </div>

      {/* Mobile create form */}
      {creating && (
        <div className="sm:hidden">
          <CreateProjectForm onDone={() => setCreating(false)} />
        </div>
      )}
    </>
  );
}
