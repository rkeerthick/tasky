"use client";

import { cn } from "@/lib/utils";

export type GroupBy = "none" | "status" | "project";
export type StatusFilter = "all" | "TODO" | "DONE";
export type SortMode = "manual" | "due" | "priority" | "created";

interface FilterBarProps {
  groupBy: GroupBy;
  statusFilter: StatusFilter;
  sortMode: SortMode;
  onGroupBy: (v: GroupBy) => void;
  onStatusFilter: (v: StatusFilter) => void;
  onSortMode: (v: SortMode) => void;
}

function Chip<T extends string>({
  value,
  active,
  label,
  onClick,
}: {
  value: T;
  active: boolean;
  label: string;
  onClick: (v: T) => void;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-700",
      )}
    >
      {label}
    </button>
  );
}

export function FilterBar({
  groupBy,
  statusFilter,
  sortMode,
  onGroupBy,
  onStatusFilter,
  onSortMode,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Group by */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="flex-shrink-0 text-xs text-zinc-400">Group</span>
        {(["none", "status", "project"] as const).map((v) => (
          <Chip
            key={v}
            value={v}
            active={groupBy === v}
            label={v === "none" ? "Off" : v === "status" ? "Status" : "Project"}
            onClick={onGroupBy}
          />
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="flex-shrink-0 text-xs text-zinc-400">Show</span>
        <Chip value="all" active={statusFilter === "all"} label="All" onClick={onStatusFilter} />
        <Chip value="TODO" active={statusFilter === "TODO"} label="To do" onClick={onStatusFilter} />
        <Chip value="DONE" active={statusFilter === "DONE"} label="Done" onClick={onStatusFilter} />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="flex-shrink-0 text-xs text-zinc-400">Sort</span>
        <select
          value={sortMode}
          onChange={(e) => onSortMode(e.target.value as SortMode)}
          className="rounded-lg border-0 bg-white py-1 pl-2 pr-6 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 focus:outline-none focus:ring-zinc-400"
        >
          <option value="manual">Manual</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="created">Created</option>
        </select>
      </div>
    </div>
  );
}
