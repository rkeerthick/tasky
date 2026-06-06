"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ClientProject } from "@/types";

export const PROJECTS_KEY = ["projects"] as const;

async function apiFetchProjects(): Promise<ClientProject[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return ((await res.json()) as { projects: ClientProject[] }).projects;
}

export function useProjectsQuery(initialData?: ClientProject[]) {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: apiFetchProjects,
    initialData,
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      return ((await res.json()) as { project: ClientProject }).project;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: PROJECTS_KEY });
      const prev = qc.getQueryData<ClientProject[]>(PROJECTS_KEY) ?? [];
      const optimistic: ClientProject = {
        id: `opt-${Date.now()}`,
        userId: "",
        name: input.name,
        color: input.color,
      };
      qc.setQueryData<ClientProject[]>(PROJECTS_KEY, [...prev, optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(PROJECTS_KEY, ctx.prev);
      toast.error("Failed to create project");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; color?: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      return ((await res.json()) as { project: ClientProject }).project;
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: PROJECTS_KEY });
      const prev = qc.getQueryData<ClientProject[]>(PROJECTS_KEY) ?? [];
      qc.setQueryData<ClientProject[]>(
        PROJECTS_KEY,
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(PROJECTS_KEY, ctx.prev);
      toast.error("Failed to update project");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: PROJECTS_KEY });
      const prev = qc.getQueryData<ClientProject[]>(PROJECTS_KEY) ?? [];
      qc.setQueryData<ClientProject[]>(PROJECTS_KEY, prev.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(PROJECTS_KEY, ctx.prev);
      toast.error("Failed to delete project");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}
