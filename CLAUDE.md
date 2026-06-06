# Tasky — CLAUDE.md

Personal todo/task tracker. Reference this file before making decisions about architecture, conventions, or tooling.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript — strict mode |
| Database | PostgreSQL via Prisma |
| Auth | Auth.js (magic-link only) |
| Client data | TanStack Query (optimistic updates) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| PWA | installable via next-pwa or similar |

## Project Structure

```
app/                  # Next.js App Router — routes live here
  (auth)/             # Auth-related routes (login, verify)
  (app)/              # Protected app routes
    layout.tsx        # Session guard lives here
    tasks/
      page.tsx        # Server component — fetches initial data
      _components/    # Route-colocated components
components/           # Shared UI components only (reused across 2+ routes)
lib/
  db/                 # Data layer — all Prisma access goes here
    tasks.ts
    users.ts
  auth.ts             # Auth.js config
  validations/        # Zod schemas, one file per domain
prisma/
  schema.prisma
```

## Component Rules

- **Server components by default.** Only add `"use client"` when the component needs browser APIs, event handlers, or React state/effects.
- **Colocate with routes.** Components used by a single route go in a `_components/` folder next to that route's `page.tsx`, not in the top-level `components/` directory.
- **No Prisma calls in components or API routes.** All DB access goes through functions in `lib/db/`. Components and route handlers import from there.

## Data Fetching Pattern

- **Server components** call `lib/db/` functions directly (no fetch, no TanStack Query).
- **Client components** use TanStack Query hooks. Pass server-fetched data as `initialData` to avoid a loading flash.
- **Optimistic updates** via TanStack Query `useMutation` + `onMutate` / `onError` rollback. Keep the optimistic state shape identical to the server response shape.

## API Routes

Every route handler in `app/api/` must:
1. Parse and validate the request body/params with a Zod schema before touching any logic.
2. Return typed JSON responses (no `any`).
3. Handle auth — reject unauthenticated requests with 401.

```ts
// pattern
const body = RequestSchema.parse(await req.json()); // throws 400-equivalent on failure
```

## TypeScript

- `strict: true` in `tsconfig.json` — no exceptions.
- `any` is banned. Use `unknown` + narrowing, or a proper type.
- Zod schemas are the single source of truth for runtime-validated shapes; derive TypeScript types from them with `z.infer<>`.

## Auth

- Magic-link only (no passwords). Auth.js handles token generation and email delivery.
- Session is available server-side via `auth()` from `lib/auth.ts`.
- Protected routes check session in the route-group layout, not in individual pages.

## Environment Variables

All variables must be documented in `.env.example` with a description comment. Never commit `.env.local`. Required vars:

```
DATABASE_URL=          # Postgres connection string
AUTH_SECRET=           # Auth.js secret (openssl rand -base64 32)
AUTH_RESEND_KEY=       # Resend API key for magic-link emails
NEXTAUTH_URL=          # Public base URL (set automatically on Vercel)
```

## Styling

- Tailwind utility classes only — no custom CSS files except `globals.css` for base resets.
- No inline `style` props except for truly dynamic values (e.g., progress bar widths).
- Dark mode via Tailwind `dark:` variants if supported.

## Code Quality

- **ESLint** — `next/core-web-vitals` + `@typescript-eslint/recommended`. No disabled rules without a comment explaining why.
- **Prettier** — default config. Format on save.
- **No commented-out code** in committed files.

## Testing

| Type | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure functions in `lib/` — data transformations, Zod schemas, utilities |
| E2E | Playwright | One happy-path flow: sign in → create task → complete task → sign out |

- Unit tests colocate with source: `lib/db/tasks.test.ts` next to `lib/db/tasks.ts`.
- E2E tests live in `e2e/`.
- Do not mock the database in unit tests for the data layer — test against a real test DB or skip and cover with E2E.

## PWA

- Manifest and service worker config live in `public/`.
- App must be installable on mobile (valid manifest, HTTPS, service worker).
- Offline behavior: show cached tasks, queue mutations, sync when online.

## Commit Style

Short imperative subject line (`add task completion toggle`). No body unless the why is non-obvious.
