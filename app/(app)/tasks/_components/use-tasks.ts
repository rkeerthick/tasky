"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ClientTask } from "@/types";

export const TASKS_KEY = ["tasks"] as const;

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function apiFetchTasks(): Promise<ClientTask[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = (await res.json()) as { tasks: ClientTask[] };
  return data.tasks;
}

export function useTasksQuery(initialData?: ClientTask[]) {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: apiFetchTasks,
    initialData,
    staleTime: 30_000,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTasks(qc: QueryClient): ClientTask[] {
  return qc.getQueryData<ClientTask[]>(TASKS_KEY) ?? [];
}

function onMutateBase(qc: QueryClient) {
  return async () => {
    await qc.cancelQueries({ queryKey: TASKS_KEY });
    return { prev: getTasks(qc) };
  };
}

function onError(qc: QueryClient, message: string) {
  return (_: unknown, __: unknown, ctx: { prev: ClientTask[] } | undefined) => {
    if (ctx) qc.setQueryData(TASKS_KEY, ctx.prev);
    toast.error(message);
  };
}

function onSettled(qc: QueryClient) {
  return () => qc.invalidateQueries({ queryKey: TASKS_KEY });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateInput = {
  title: string;
  notes?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  projectId?: string;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      return ((await res.json()) as { task: ClientTask }).task;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = getTasks(qc);
      const maxOrder = prev.reduce((m, t) => Math.max(m, t.order), 0);
      const optimistic: ClientTask = {
        id: `opt-${Date.now()}`,
        userId: "",
        title: input.title,
        notes: input.notes ?? null,
        status: "TODO",
        priority: input.priority ?? null,
        dueDate: input.dueDate ?? null,
        order: maxOrder + 1,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        projectId: input.projectId ?? null,
      };
      qc.setQueryData<ClientTask[]>(TASKS_KEY, [...prev, optimistic]);
      return { prev };
    },
    onError: onError(qc, "Failed to create task"),
    onSettled: onSettled(qc),
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export type UpdateInput = {
  id: string;
  title?: string;
  notes?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  dueDate?: string | null;
  projectId?: string | null;
};

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateInput) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      return ((await res.json()) as { task: ClientTask }).task;
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = getTasks(qc);
      qc.setQueryData<ClientTask[]>(
        TASKS_KEY,
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
      return { prev };
    },
    onError: onError(qc, "Failed to update task"),
    onSettled: onSettled(qc),
  });
}

// ─── Toggle complete ──────────────────────────────────────────────────────────

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error();
      return ((await res.json()) as { task: ClientTask }).task;
    },
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = getTasks(qc);
      qc.setQueryData<ClientTask[]>(
        TASKS_KEY,
        prev.map((t) =>
          t.id !== taskId
            ? t
            : {
                ...t,
                status: t.status === "TODO" ? "DONE" : "TODO",
                completedAt:
                  t.status === "TODO" ? new Date().toISOString() : null,
              },
        ),
      );
      return { prev };
    },
    onError: onError(qc, "Failed to update task"),
    onSettled: onSettled(qc),
  });
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = getTasks(qc);
      qc.setQueryData<ClientTask[]>(
        TASKS_KEY,
        prev.filter((t) => t.id !== taskId),
      );
      return { prev };
    },
    onError: onError(qc, "Failed to delete task"),
    onSettled: onSettled(qc),
  });
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error();
    },
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = getTasks(qc);
      const orderMap = new Map(updates.map(({ id, order }) => [id, order]));
      qc.setQueryData<ClientTask[]>(
        TASKS_KEY,
        prev.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t)),
      );
      return { prev };
    },
    onError: onError(qc, "Failed to reorder tasks"),
    onSettled: onSettled(qc),
  });
}
