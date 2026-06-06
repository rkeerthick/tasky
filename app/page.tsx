import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// This route just dispatches: signed-in users go to the app, everyone else
// to the sign-in page. There is no separate marketing landing page.
export default async function RootPage() {
  const session = await auth();
  if (session) redirect("/tasks");
  redirect("/signin");
}
