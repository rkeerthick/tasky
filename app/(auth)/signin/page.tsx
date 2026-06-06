import { signIn } from "@/lib/auth";
import { SignInForm } from "./_components/sign-in-form";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const { error, callbackUrl } = await searchParams;

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    try {
      await signIn("resend", {
        email,
        redirectTo: callbackUrl ?? "/tasks",
      });
    } catch (err) {
      // Auth.js throws a NEXT_REDIRECT for success — let Next.js handle it.
      if (err instanceof AuthError) {
        redirect(`/signin?error=${err.type}`);
      }
      throw err;
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Sign in to Tasky
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a magic link.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-100 bg-white px-6 py-8 shadow-sm">
        <SignInForm action={handleSignIn} error={error} />
      </div>
    </div>
  );
}
