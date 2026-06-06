import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listProjects, createProject } from "@/lib/db/projects";
import { createProjectSchema } from "@/lib/validations/projects";
import { ZodError } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await listProjects(session.user.id);
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createProjectSchema.parse(await req.json());
    const project = await createProject(session.user.id, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    throw err;
  }
}
