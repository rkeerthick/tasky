// Client-safe versions of Prisma models — dates serialised to ISO strings.

export type TaskStatus = "TODO" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface ClientTask {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: Priority | null;
  dueDate: string | null;
  order: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  projectId: string | null;
}

export interface ClientProject {
  id: string;
  userId: string;
  name: string;
  color: string;
}
