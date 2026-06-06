import { db } from "@/lib/db";
import type { Task } from "@prisma/client";
import type {
  CreateTaskInput,
  ListTasksQuery,
  ReorderTasksInput,
  UpdateTaskInput,
} from "@/lib/validations/tasks";

// All functions take userId as the first argument and always include it in
// WHERE clauses so a user can never read or mutate another user's data.

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listTasks(
  userId: string,
  filters: ListTasksQuery = {},
): Promise<Task[]> {
  const { status, projectId, dueBefore, dueAfter } = filters;

  return db.task.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(status !== undefined && { status }),
      ...(projectId !== undefined && { projectId }),
      ...(dueBefore !== undefined || dueAfter !== undefined
        ? {
            dueDate: {
              ...(dueBefore !== undefined && { lte: dueBefore }),
              ...(dueAfter !== undefined && { gte: dueAfter }),
            },
          }
        : {}),
    },
    orderBy: { order: "asc" },
  });
}

export async function getTask(
  userId: string,
  taskId: string,
): Promise<Task | null> {
  return db.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const order = input.order ?? (await nextOrder(userId));
  return db.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority ?? null,
      dueDate: input.dueDate ?? null,
      projectId: input.projectId ?? null,
      order,
    },
  });
}

async function nextOrder(userId: string): Promise<number> {
  const last = await db.task.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return last ? last.order + 1 : 1;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  // updateMany enforces ownership atomically — returns count 0 if not found.
  const result = await db.task.updateMany({
    where: { id: taskId, userId, deletedAt: null },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...("notes" in input && { notes: input.notes }),
      ...("priority" in input && { priority: input.priority }),
      ...("dueDate" in input && { dueDate: input.dueDate }),
      ...("projectId" in input && { projectId: input.projectId }),
    },
  });
  if (result.count === 0) return null;
  return db.task.findFirst({ where: { id: taskId, userId } });
}

// ─── Toggle complete ──────────────────────────────────────────────────────────

export async function toggleTaskComplete(
  userId: string,
  taskId: string,
): Promise<Task | null> {
  const task = await db.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });
  if (!task) return null;

  const markingDone = task.status === "TODO";
  return db.task.update({
    where: { id: taskId },
    data: {
      status: markingDone ? "DONE" : "TODO",
      completedAt: markingDone ? new Date() : null,
    },
  });
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function softDeleteTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const result = await db.task.updateMany({
    where: { id: taskId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderTasks(
  userId: string,
  { updates }: ReorderTasksInput,
): Promise<boolean> {
  const ids = updates.map((u) => u.id);

  // Verify all IDs belong to this user before touching anything.
  const owned = await db.task.findMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    select: { id: true },
  });
  if (owned.length !== ids.length) return false;

  await db.$transaction(
    updates.map(({ id, order }) =>
      db.task.update({ where: { id }, data: { order } }),
    ),
  );
  return true;
}
