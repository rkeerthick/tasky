import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

// next-auth v5 handler types predate Next.js 16's async-params requirement.
// At runtime Auth.js handles routing correctly; the cast satisfies tsc.
export const GET = handlers.GET as (req: NextRequest) => Promise<Response>;
export const POST = handlers.POST as (req: NextRequest) => Promise<Response>;
