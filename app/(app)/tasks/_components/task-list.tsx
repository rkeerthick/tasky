"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import {
  useTasksQuery,
  useReorderTasks,
  useToggleTask,
  useDeleteTask,
} from "./use-tasks";
import { FilterBar, type GroupBy, type StatusFilter, type SortMode } from "./filter-bar";
import { ProjectSidebar, type ViewMode, applyViewFilter } from "./project-sidebar";
import { AddTaskRow } from "./add-task-row";
import { TaskItem } from "./task-item";
import { EmptyState } from "./empty-state";
import type { ClientTask, ClientProject, Priority } from "@/types";

// ─── Sort ─────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function sortTasks(tasks: ClientTask[], sortMode: SortMode): ClientTask[] {
  return [...tasks].sort((a, b) => {
    switch (sortMode) {
      case "manual":
        return a.order - b.order;
      case "due":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "priority": {
        const pa = a.priority != null ? PRIORITY_ORDER[a.priority] : 3;
        const pb = b.priority != null ? PRIORITY_ORDER[b.priority] : 3;
        return pa - pb;
      }
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

// ─── Group ────────────────────────────────────────────────────────────────────

interface TaskGroup {
  key: string;
  label: string | null;
  color?: string;
  tasks: ClientTask[];
}

function buildGroups(
  tasks: ClientTask[],
  groupBy: GroupBy,
  projects: ClientProject[],
): TaskGroup[] {
  if (groupBy === "status") {
    return [
      { key: "TODO", label: "To do", tasks: tasks.filter((t) => t.status === "TODO") },
      { key: "DONE", label: "Done", tasks: tasks.filter((t) => t.status === "DONE") },
    ];
  }

  if (groupBy === "project") {
    const byProject: TaskGroup[] = projects.map((p) => ({
      key: p.id,
      label: p.name,
      color: p.color,
      tasks: tasks.filter((t) => t.projectId === p.id),
    }));
    const inbox: TaskGroup = {
      key: "inbox",
      label: "Inbox",
      tasks: tasks.filter((t) => !t.projectId),
    };
    return [...byProject, inbox].filter((g) => g.tasks.length > 0);
  }

  return [{ key: "all", label: null, tasks }];
}

function GroupHeader({ label, color, count }: { label: string; color?: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-2">
      {color && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <span className="ml-auto text-xs text-zinc-300">{count}</span>
    </div>
  );
}

// ─── TaskList ─────────────────────────────────────────────────────────────────

interface TaskListProps {
  initialTasks: ClientTask[];
  projects: ClientProject[];
}

export function TaskList({ initialTasks, projects }: TaskListProps) {
  const { data: allTasks = [] } = useTasksQuery(initialTasks);
  const { mutate: reorderTasks } = useReorderTasks();
  const { mutate: toggleTask } = useToggleTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  // Apply all filters then sort
  const processedTasks = useMemo(() => {
    let tasks = applyViewFilter(allTasks, viewMode);
    if (statusFilter !== "all") tasks = tasks.filter((t) => t.status === statusFilter);
    if (projectFilter) tasks = tasks.filter((t) => t.projectId === projectFilter);
    return sortTasks(tasks, sortMode);
  }, [allTasks, viewMode, statusFilter, projectFilter, sortMode]);

  const groups = useMemo(
    () => buildGroups(processedTasks, groupBy, projects),
    [processedTasks, groupBy, projects],
  );

  // Flat ordered ID list used by SortableContext and keyboard navigation
  const flatOrderedIds = useMemo(
    () => groups.flatMap((g) => g.tasks.map((t) => t.id)),
    [groups],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable;

      // n → focus add-task input
      if (e.key === "n" && !inInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        addInputRef.current?.focus();
        return;
      }

      if (inInput) return;

      // Escape → deselect
      if (e.key === "Escape") {
        setSelectedTaskId(null);
        return;
      }

      if (!selectedTaskId) return;

      // c → toggle complete
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleTask(selectedTaskId);
        return;
      }

      // d → delete
      if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        deleteTask(selectedTaskId);
        setSelectedTaskId(null);
        return;
      }

      // ↓ / ↑ → navigate tasks
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = flatOrderedIds.indexOf(selectedTaskId);
        const next =
          e.key === "ArrowDown"
            ? flatOrderedIds[Math.min(idx + 1, flatOrderedIds.length - 1)]
            : flatOrderedIds[Math.max(idx - 1, 0)];
        if (next) setSelectedTaskId(next);
      }
    },
    [selectedTaskId, flatOrderedIds, toggleTask, deleteTask],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Drag to reorder (only when sort=manual) ─────────────────────────────────

  const isDragEnabled = sortMode === "manual";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const oldIndex = flatOrderedIds.indexOf(active.id as string);
    const newIndex = flatOrderedIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(flatOrderedIds, oldIndex, newIndex);
    const prev = reordered[newIndex - 1];
    const next = reordered[newIndex + 1];
    const prevOrder = processedTasks.find((t) => t.id === prev)?.order ?? 0;
    const nextOrder = processedTasks.find((t) => t.id === next)?.order ?? prevOrder + 2;

    reorderTasks([{ id: active.id as string, order: (prevOrder + nextOrder) / 2 }]);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  function renderTaskGroups() {
    if (processedTasks.length === 0) {
      return (
        <EmptyState
          viewMode={viewMode}
          statusFilter={statusFilter}
          hasProjectFilter={projectFilter !== null}
        />
      );
    }

    const groupEls = groups.map((group) => (
      <section key={group.key}>
        {group.label && (
          <GroupHeader label={group.label} color={group.color} count={group.tasks.length} />
        )}
        <div className={cn("space-y-2", group.label && "mt-1")}>
          {group.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              project={task.projectId ? projectById.get(task.projectId) : undefined}
              isSelected={selectedTaskId === task.id}
              onSelect={setSelectedTaskId}
              showDragHandle={isDragEnabled}
            />
          ))}
        </div>
      </section>
    ));

    if (!isDragEnabled) {
      return <div className="space-y-5">{groupEls}</div>;
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flatOrderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">{groupEls}</div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    // sm: two-column layout with sidebar; mobile: single column
    <div className="flex gap-6">
      <ProjectSidebar
        tasks={allTasks}
        projects={projects}
        viewMode={viewMode}
        projectFilter={projectFilter}
        onViewMode={setViewMode}
        onProjectFilter={setProjectFilter}
      />

      <div className="min-w-0 flex-1 space-y-4">
        <FilterBar
          groupBy={groupBy}
          statusFilter={statusFilter}
          sortMode={sortMode}
          onGroupBy={setGroupBy}
          onStatusFilter={setStatusFilter}
          onSortMode={setSortMode}
        />

        <AddTaskRow
          ref={addInputRef}
          projects={projects}
          defaultProjectId={projectFilter}
        />

        {renderTaskGroups()}

        {/* Keyboard shortcut hint */}
        <p className="hidden pt-2 text-center text-xs text-zinc-300 sm:block">
          <kbd className="rounded border border-zinc-200 px-1 font-sans">N</kbd> add &nbsp;·&nbsp;
          <kbd className="rounded border border-zinc-200 px-1 font-sans">C</kbd> complete &nbsp;·&nbsp;
          <kbd className="rounded border border-zinc-200 px-1 font-sans">D</kbd> delete &nbsp;·&nbsp;
          <kbd className="rounded border border-zinc-200 px-1 font-sans">↑↓</kbd> navigate
        </p>
      </div>
    </div>
  );
}
