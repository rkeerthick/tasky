"use client";

import { cn } from "@/lib/utils";
import type { ClientTask, ClientProject } from "@/types";

export type ViewMode = "all" | "today" | "upcoming" | "no-date";

// ─── View-mode helpers ────────────────────────────────────────────────────────

export function applyViewFilter(tasks: ClientTask[], viewMode: ViewMode): ClientTask[] {
  if (viewMode === "all") return tasks;

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const sevenDaysEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
    23,
    59,
    59,
    999,
  );

  switch (viewMode) {
    case "today":
      return tasks.filter((t) => t.dueDate && new Date(t.dueDate) <= todayEnd);
    case "upcoming":
      return tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= tomorrowStart &&
          new Date(t.dueDate) <= sevenDaysEnd,
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

// ─── Single nav item ──────────────────────────────────────────────────────────

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function NavItem({ label, icon, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      <span className={cn("flex-shrink-0", active ? "text-white" : "text-zinc-400")}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
            active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {count}
        </span>
      )}
    </button>
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
  // Count only TODO tasks for the view badges
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

  const navItems = (
    <>
      <NavItem
        label="All tasks"
        icon={<InboxIcon />}
        count={counts.all}
        active={viewMode === "all" && projectFilter === null}
        onClick={() => { onViewMode("all"); onProjectFilter(null); }}
      />
      <NavItem
        label="Today"
        icon={<SunIcon />}
        count={counts.today}
        active={viewMode === "today"}
        onClick={() => { onViewMode("today"); onProjectFilter(null); }}
      />
      <NavItem
        label="Upcoming"
        icon={<CalendarIcon />}
        count={counts.upcoming}
        active={viewMode === "upcoming"}
        onClick={() => { onViewMode("upcoming"); onProjectFilter(null); }}
      />
      <NavItem
        label="No date"
        icon={<NoDateIcon />}
        count={counts.noDate}
        active={viewMode === "no-date"}
        onClick={() => { onViewMode("no-date"); onProjectFilter(null); }}
      />
    </>
  );

  const projectItems = projects.length > 0 && (
    <>
      <div className="my-1 border-t border-zinc-100" />
      <p className="px-2.5 pb-0.5 pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Projects
      </p>
      {projects.map((p) => (
        <NavItem
          key={p.id}
          label={p.name}
          count={projectCounts.get(p.id)}
          active={projectFilter === p.id}
          icon={
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
          }
          onClick={() => { onViewMode("all"); onProjectFilter(p.id); }}
        />
      ))}
    </>
  );

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside className="hidden w-44 flex-shrink-0 sm:block">
        <nav className="space-y-0.5">
          {navItems}
          {projectItems}
        </nav>
      </aside>

      {/* Mobile: horizontal scrolling pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden" role="navigation">
        {[
          { mode: "all" as ViewMode, label: "All", proj: null, count: counts.all },
          { mode: "today" as ViewMode, label: "Today", proj: null, count: counts.today },
          { mode: "upcoming" as ViewMode, label: "Upcoming", proj: null, count: counts.upcoming },
          { mode: "no-date" as ViewMode, label: "No date", proj: null, count: counts.noDate },
        ].map(({ mode, label, proj, count }) => {
          const isActive = viewMode === mode && (mode !== "all" || projectFilter === null);
          return (
            <button
              key={mode}
              onClick={() => { onViewMode(mode); onProjectFilter(proj); }}
              className={cn(
                "flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50",
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1 text-xs",
                    isActive ? "text-white/70" : "text-zinc-400",
                  )}
                >
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
                "flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50",
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
              {count > 0 && (
                <span className={cn("text-xs", isActive ? "text-white/70" : "text-zinc-400")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
