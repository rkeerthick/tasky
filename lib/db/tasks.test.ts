import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import {
  listTasks,
  createTask,
  getTask,
  updateTask,
  softDeleteTask,
  toggleTaskComplete,
  reorderTasks,
} from "@/lib/db/tasks";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeUser(tag: string) {
  return db.user.create({
    data: { email: `test-${tag}-${Date.now()}@vitest.local` },
  });
}

async function seed(userId: string, overrides: Partial<Parameters<typeof createTask>[1]> = {}) {
  return createTask(userId, { title: "Test task", order: 1, ...overrides });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let userId: string;
let otherId: string;
const createdUserIds: string[] = [];

beforeEach(async () => {
  const [user, other] = await Promise.all([makeUser("owner"), makeUser("other")]);
  userId = user.id;
  otherId = other.id;
  createdUserIds.push(userId, otherId);
});

afterEach(async () => {
  // Clean up in FK-safe order: tasks first, then users.
  await db.task.deleteMany({ where: { userId: { in: createdUserIds } } });
  await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
});

// ─── listTasks ────────────────────────────────────────────────────────────────

describe("listTasks", () => {
  it("returns only the requesting user's tasks", async () => {
    await Promise.all([seed(userId), seed(otherId)]);
    const tasks = await listTasks(userId);
    expect(tasks.every((t) => t.userId === userId)).toBe(true);
    expect(tasks).toHaveLength(1);
  });

  it("excludes soft-deleted tasks", async () => {
    const task = await seed(userId);
    await softDeleteTask(userId, task.id);
    const tasks = await listTasks(userId);
    expect(tasks.find((t) => t.id === task.id)).toBeUndefined();
  });

  it("filters by status", async () => {
    const todo = await seed(userId, { title: "todo task" });
    const done = await seed(userId, { title: "done task", order: 2 });
    await toggleTaskComplete(userId, done.id);

    const todoList = await listTasks(userId, { status: "TODO" });
    const doneList = await listTasks(userId, { status: "DONE" });

    expect(todoList.map((t) => t.id)).toContain(todo.id);
    expect(todoList.map((t) => t.id)).not.toContain(done.id);
    expect(doneList.map((t) => t.id)).toContain(done.id);
    expect(doneList.map((t) => t.id)).not.toContain(todo.id);
  });

  it("filters by projectId", async () => {
    const project = await db.project.create({
      data: { userId, name: "P", color: "#000" },
    });
    const inProject = await seed(userId, { projectId: project.id });
    await seed(userId, { title: "no project", order: 2 });

    const tasks = await listTasks(userId, { projectId: project.id });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(inProject.id);
  });

  it("filters by due date range", async () => {
    const past = new Date("2020-01-01T00:00:00Z");
    const future = new Date("2099-01-01T00:00:00Z");

    await seed(userId, { dueDate: past, title: "past" });
    await seed(userId, { dueDate: future, title: "future", order: 2 });

    const before2030 = await listTasks(userId, {
      dueBefore: new Date("2030-01-01"),
    });
    expect(before2030.every((t) => t.title === "past")).toBe(true);

    const after2030 = await listTasks(userId, {
      dueAfter: new Date("2030-01-01"),
    });
    expect(after2030.every((t) => t.title === "future")).toBe(true);
  });
});

// ─── getTask ──────────────────────────────────────────────────────────────────

describe("getTask", () => {
  it("returns the task for the correct owner", async () => {
    const task = await seed(userId);
    const found = await getTask(userId, task.id);
    expect(found?.id).toBe(task.id);
  });

  it("returns null for a different user (ownership check)", async () => {
    const task = await seed(userId);
    const found = await getTask(otherId, task.id);
    expect(found).toBeNull();
  });

  it("returns null for a soft-deleted task", async () => {
    const task = await seed(userId);
    await softDeleteTask(userId, task.id);
    expect(await getTask(userId, task.id)).toBeNull();
  });
});

// ─── createTask ───────────────────────────────────────────────────────────────

describe("createTask", () => {
  it("appends to the end when order is omitted", async () => {
    const first = await createTask(userId, { title: "first" });
    const second = await createTask(userId, { title: "second" });
    expect(second.order).toBeGreaterThan(first.order);
  });

  it("persists all provided fields", async () => {
    const dueDate = new Date("2099-06-01T00:00:00.000Z");
    const task = await createTask(userId, {
      title: "Full task",
      notes: "some notes",
      priority: "HIGH",
      dueDate,
      order: 42,
    });
    expect(task.title).toBe("Full task");
    expect(task.notes).toBe("some notes");
    expect(task.priority).toBe("HIGH");
    expect(task.dueDate?.toISOString()).toBe(dueDate.toISOString());
    expect(task.order).toBe(42);
  });
});

// ─── updateTask ───────────────────────────────────────────────────────────────

describe("updateTask", () => {
  it("updates fields for the owner", async () => {
    const task = await seed(userId);
    const updated = await updateTask(userId, task.id, { title: "New title" });
    expect(updated?.title).toBe("New title");
  });

  it("returns null for a different user (ownership check)", async () => {
    const task = await seed(userId);
    const result = await updateTask(otherId, task.id, { title: "Hijack" });
    expect(result).toBeNull();
    // Original should be unchanged
    const original = await getTask(userId, task.id);
    expect(original?.title).toBe("Test task");
  });

  it("can clear nullable fields by setting them to null", async () => {
    const task = await seed(userId, { priority: "HIGH" });
    const updated = await updateTask(userId, task.id, { priority: null });
    expect(updated?.priority).toBeNull();
  });
});

// ─── softDeleteTask ───────────────────────────────────────────────────────────

describe("softDeleteTask", () => {
  it("sets deletedAt instead of removing the row", async () => {
    const task = await seed(userId);
    await softDeleteTask(userId, task.id);

    const raw = await db.task.findUnique({ where: { id: task.id } });
    expect(raw).not.toBeNull(); // row still exists
    expect(raw?.deletedAt).not.toBeNull(); // but is marked deleted
  });

  it("returns true when the task was deleted", async () => {
    const task = await seed(userId);
    expect(await softDeleteTask(userId, task.id)).toBe(true);
  });

  it("returns false for a different user (ownership check)", async () => {
    const task = await seed(userId);
    expect(await softDeleteTask(otherId, task.id)).toBe(false);
    // Row should be untouched
    const raw = await db.task.findUnique({ where: { id: task.id } });
    expect(raw?.deletedAt).toBeNull();
  });

  it("returns false when called a second time on an already-deleted task", async () => {
    const task = await seed(userId);
    await softDeleteTask(userId, task.id);
    expect(await softDeleteTask(userId, task.id)).toBe(false);
  });
});

// ─── toggleTaskComplete ───────────────────────────────────────────────────────

describe("toggleTaskComplete", () => {
  it("marks a TODO task as DONE and sets completedAt", async () => {
    const task = await seed(userId);
    expect(task.status).toBe("TODO");

    const toggled = await toggleTaskComplete(userId, task.id);
    expect(toggled?.status).toBe("DONE");
    expect(toggled?.completedAt).not.toBeNull();
  });

  it("marks a DONE task back to TODO and clears completedAt", async () => {
    const task = await seed(userId);
    await toggleTaskComplete(userId, task.id); // → DONE
    const reverted = await toggleTaskComplete(userId, task.id); // → TODO
    expect(reverted?.status).toBe("TODO");
    expect(reverted?.completedAt).toBeNull();
  });

  it("returns null for a different user (ownership check)", async () => {
    const task = await seed(userId);
    expect(await toggleTaskComplete(otherId, task.id)).toBeNull();
  });
});

// ─── reorderTasks ─────────────────────────────────────────────────────────────

describe("reorderTasks", () => {
  it("updates order values for all provided tasks", async () => {
    const [a, b] = await Promise.all([
      seed(userId, { title: "a", order: 1 }),
      seed(userId, { title: "b", order: 2 }),
    ]);

    await reorderTasks(userId, { updates: [{ id: a.id, order: 10 }, { id: b.id, order: 5 }] });

    const tasks = await listTasks(userId);
    const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
    expect(byId[a.id].order).toBe(10);
    expect(byId[b.id].order).toBe(5);
  });

  it("returns false if any task belongs to a different user", async () => {
    const mine = await seed(userId, { title: "mine", order: 1 });
    const theirs = await seed(otherId, { title: "theirs", order: 1 });

    const result = await reorderTasks(userId, {
      updates: [
        { id: mine.id, order: 99 },
        { id: theirs.id, order: 99 }, // cross-user injection attempt
      ],
    });
    expect(result).toBe(false);

    // Neither task's order should have changed
    const raw = await db.task.findUnique({ where: { id: mine.id } });
    expect(raw?.order).toBe(1);
  });
});
