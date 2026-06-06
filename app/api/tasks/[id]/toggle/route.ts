import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { toggleTaskComplete } from "@/lib/db/tasks";
import { unauthorized, notFound, internalError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;

  try {
    const task = await toggleTaskComplete(session.user.id, id);
    if (!task) return notFound();
    return NextResponse.json({ task });
  } catch {
    return internalError();
  }
}
