import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { listTasks, createTask } from "@/lib/db/tasks";
import {
  listTasksQuerySchema,
  createTaskSchema,
} from "@/lib/validations/tasks";
import { unauthorized, badRequest, internalError } from "@/lib/api";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(request.url);
  const parsed = listTasksQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const tasks = await listTasks(session.user.id, parsed.data);
    return NextResponse.json({ tasks });
  } catch {
    return internalError();
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body: unknown = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const task = await createTask(session.user.id, parsed.data);
    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return internalError();
  }
}
