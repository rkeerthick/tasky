import { db } from "@/lib/db";
import type { Project } from "@prisma/client";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/projects";

export async function listProjects(userId: string): Promise<Project[]> {
  return db.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  return db.project.create({
    data: { userId, name: input.name, color: input.color },
  });
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const result = await db.project.updateMany({
    where: { id: projectId, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });
  if (result.count === 0) return null;
  return db.project.findFirst({ where: { id: projectId, userId } });
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const result = await db.project.deleteMany({
    where: { id: projectId, userId },
  });
  return result.count > 0;
}
