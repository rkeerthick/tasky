import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session) redirect("/tasks");
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      {children}
    </div>
  );
}
