import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        {/* Envelope icon */}
        <svg
          className="h-8 w-8 text-zinc-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-zinc-900">Check your email</h1>
      <p className="mt-2 text-sm text-zinc-500">
        We sent a sign-in link to your inbox. Click it to sign in — no password
        needed.
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Didn&apos;t get it? Check your spam folder.
      </p>

      <Link
        href="/signin"
        className="mt-6 inline-block text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
      >
        Try a different email
      </Link>
    </div>
  );
}
