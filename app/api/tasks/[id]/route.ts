import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { updateTask, softDeleteTask } from "@/lib/db/tasks";
import { updateTaskSchema } from "@/lib/validations/tasks";
import { unauthorized, badRequest, notFound, internalError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const task = await updateTask(session.user.id, id, parsed.data);
    if (!task) return notFound();
    return NextResponse.json({ task });
  } catch {
    return internalError();
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;

  try {
    const deleted = await softDeleteTask(session.user.id, id);
    if (!deleted) return notFound();
    return new NextResponse(null, { status: 204 });
  } catch {
    return internalError();
  }
}
