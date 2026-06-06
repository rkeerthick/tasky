import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listTasks } from "@/lib/db/tasks";
import { db } from "@/lib/db";
import { TaskList } from "./_components/task-list";
import type { ClientTask, ClientProject } from "@/types";
import type { Task, Project } from "@prisma/client";

function serializeTask(t: Task): ClientTask {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    notes: t.notes,
    status: t.status as ClientTask["status"],
    priority: t.priority as ClientTask["priority"],
    dueDate: t.dueDate?.toISOString() ?? null,
    order: t.order,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    deletedAt: t.deletedAt?.toISOString() ?? null,
    projectId: t.projectId,
  };
}

function serializeProject(p: Project): ClientProject {
  return { id: p.id, userId: p.userId, name: p.name, color: p.color };
}

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [tasks, projects] = await Promise.all([
    listTasks(session.user.id),
    db.project.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Tasky
          </h1>
          <div className="flex items-center gap-3">
            {session.user.email && (
              <span className="hidden text-xs text-zinc-400 sm:block">
                {session.user.email}
              </span>
            )}
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <TaskList
          initialTasks={tasks.map(serializeTask)}
          projects={projects.map(serializeProject)}
        />
      </main>
    </div>
  );
}
