"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
    >
      {pending ? "Sending link…" : "Send magic link"}
    </button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  EmailSignin: "Failed to send the sign-in email. Check your Resend API key.",
  Default: "Something went wrong. Please try again.",
};

interface SignInFormProps {
  action: (formData: FormData) => Promise<void>;
  error?: string;
}

export function SignInForm({ action, error }: SignInFormProps) {
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errorMessage}</p>
      )}

      <SubmitButton />
    </form>
  );
}
