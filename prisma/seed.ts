import { PrismaClient, TaskStatus, Priority } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Upsert a dev user so the seed is idempotent
  const user = await db.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "Dev User",
    },
  });

  // Projects
  const [work, personal] = await Promise.all([
    db.project.upsert({
      where: { id: "seed-project-work" },
      update: {},
      create: {
        id: "seed-project-work",
        userId: user.id,
        name: "Work",
        color: "#6366f1",
      },
    }),
    db.project.upsert({
      where: { id: "seed-project-personal" },
      update: {},
      create: {
        id: "seed-project-personal",
        userId: user.id,
        name: "Personal",
        color: "#22c55e",
      },
    }),
  ]);

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks: {
    id: string;
    userId: string;
    title: string;
    notes?: string;
    status: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    order: number;
    completedAt?: Date;
    projectId?: string;
  }[] = [
    {
      id: "seed-task-1",
      userId: user.id,
      title: "Finalize Q3 roadmap",
      notes: "Need sign-off from product and eng leads before EOW.",
      status: "TODO",
      priority: "HIGH",
      dueDate: tomorrow,
      order: 1,
      projectId: work.id,
    },
    {
      id: "seed-task-2",
      userId: user.id,
      title: "Review auth middleware PR",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: tomorrow,
      order: 2,
      projectId: work.id,
    },
    {
      id: "seed-task-3",
      userId: user.id,
      title: "Write unit tests for data layer",
      notes: "Cover createTask, updateTask, softDeleteTask.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: nextWeek,
      order: 3,
      projectId: work.id,
    },
    {
      id: "seed-task-4",
      userId: user.id,
      title: "Book dentist appointment",
      status: "TODO",
      priority: "LOW",
      order: 4,
      projectId: personal.id,
    },
    {
      id: "seed-task-5",
      userId: user.id,
      title: "Read Designing Data-Intensive Applications — ch. 5",
      status: "TODO",
      order: 5,
      projectId: personal.id,
    },
    {
      id: "seed-task-6",
      userId: user.id,
      title: "Set up Postgres locally",
      status: "DONE",
      priority: "HIGH",
      order: 6,
      completedAt: yesterday,
      projectId: work.id,
    },
    {
      id: "seed-task-7",
      userId: user.id,
      title: "Buy groceries",
      status: "DONE",
      order: 7,
      completedAt: yesterday,
      projectId: personal.id,
    },
    {
      id: "seed-task-8",
      userId: user.id,
      title: "Overdue: follow up on invoice",
      status: "TODO",
      priority: "HIGH",
      dueDate: yesterday,
      order: 8,
    },
  ];

  for (const task of tasks) {
    await db.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log(
    `Seeded user "${user.email}", ${tasks.length} tasks, 2 projects.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
