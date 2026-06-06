import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { reorderTasks } from "@/lib/db/tasks";
import { reorderTasksSchema } from "@/lib/validations/tasks";
import { unauthorized, badRequest, notFound, internalError } from "@/lib/api";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body: unknown = await request.json();
  const parsed = reorderTasksSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  try {
    const ok = await reorderTasks(session.user.id, parsed.data);
    if (!ok) return notFound();
    return NextResponse.json({ success: true });
  } catch {
    return internalError();
  }
}
