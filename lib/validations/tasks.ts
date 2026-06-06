import { z } from "zod";

// ─── Query params ─────────────────────────────────────────────────────────────

export const listTasksQuerySchema = z.object({
  status: z.enum(["TODO", "DONE"]).optional(),
  projectId: z.string().optional(),
  dueBefore: z
    .string()
    .datetime({ offset: true })
    .transform((s) => new Date(s))
    .optional(),
  dueAfter: z
    .string()
    .datetime({ offset: true })
    .transform((s) => new Date(s))
    .optional(),
});

// ─── Mutation bodies ──────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(10_000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .transform((s) => new Date(s))
    .optional(),
  projectId: z.string().optional(),
  order: z.number().optional(), // if omitted, data layer appends to end
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(500),
    notes: z.string().max(10_000).nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .transform((s) => new Date(s))
      .nullable(),
    projectId: z.string().nullable(),
  })
  .partial(); // all fields optional for PATCH semantics

export const reorderTasksSchema = z.object({
  updates: z
    .array(z.object({ id: z.string(), order: z.number() }))
    .min(1)
    .max(500),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
