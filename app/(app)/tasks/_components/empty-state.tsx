import type { ViewMode } from "./project-sidebar";
import type { StatusFilter } from "./filter-bar";

interface EmptyStateProps {
  viewMode: ViewMode;
  statusFilter: StatusFilter;
  hasProjectFilter: boolean;
}

export function EmptyState({ viewMode, statusFilter, hasProjectFilter }: EmptyStateProps) {
  let heading: string;
  let body: string;

  if (viewMode === "today") {
    heading = "Nothing due today";
    body = "Enjoy the clear schedule, or add something above.";
  } else if (viewMode === "upcoming") {
    heading = "No upcoming tasks";
    body = "Nothing scheduled for the next 7 days.";
  } else if (viewMode === "no-date") {
    heading = "No undated tasks";
    body = "Every task has a due date — nice work.";
  } else if (hasProjectFilter) {
    heading = "No tasks in this project";
    body = statusFilter !== "all" ? "Try the 'All' status filter." : "Add one above.";
  } else if (statusFilter === "DONE") {
    heading = "Nothing completed yet";
    body = "Check off a task to see it here.";
  } else if (statusFilter === "TODO") {
    heading = "All caught up";
    body = "No open tasks. Add one above.";
  } else {
    heading = "No tasks yet";
    body = "Press N or tap above to add your first task.";
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
        <svg
          className="h-7 w-7 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-700">{heading}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{body}</p>
      </div>
    </div>
  );
}
