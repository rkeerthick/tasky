# Tasky

Personal task tracker — Next.js App Router, Prisma, Auth.js (magic-link), TanStack Query, Tailwind, deployed to Vercel.

## Local setup

### Prerequisites

- Node.js 20+
- A running PostgreSQL database (local or cloud — [Supabase](https://supabase.com) free tier works)
- A [Resend](https://resend.com) account for magic-link emails (free tier is fine)

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every variable. See the table below for details.

### 3. Apply the database schema

First run (or after schema changes):

```bash
npx prisma migrate dev --name init
```

This creates the tables, runs the seed script, and regenerates the Prisma client.

> **Tip:** `npx prisma studio` opens a visual browser for your database.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the sign-in page.

---

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (`postgresql://...`) |
| `AUTH_SECRET` | ✅ | Random 32-byte secret — run `openssl rand -base64 32` |
| `AUTH_URL` | local only | Full public URL, e.g. `http://localhost:3000`. Set automatically on Vercel. |
| `AUTH_RESEND_KEY` | ✅ | Resend API key — create at [resend.com/api-keys](https://resend.com/api-keys) |
| `AUTH_EMAIL_FROM` | ✅ | Sender address, must be on a Resend-verified domain |

### Quick start with Resend

1. Sign up at [resend.com](https://resend.com) (free, no credit card).
2. Create an API key at **API Keys → Create API Key** — copy it to `AUTH_RESEND_KEY`.
3. **Verified domain** (production): go to **Domains → Add Domain** and follow the DNS steps, then set `AUTH_EMAIL_FROM` to any address on that domain.  
   **Quick testing** (dev only): use `AUTH_EMAIL_FROM="onboarding@resend.dev"` — Resend's shared sending address. Magic links will only be delivered to your own Resend account email in this mode.

### Tip: AUTH_TRUST_HOST

If you run the app behind a reverse proxy (ngrok, Nginx, Render free tier), add:

```
AUTH_TRUST_HOST="true"
```

Not needed on Vercel or when running locally without a proxy.

---

## Authentication flow

```
/               → redirects to /tasks (signed in) or /signin (guest)
/signin         → email form; submits → Auth.js sends magic link via Resend
/signin/verify  → "check your email" page
<magic link>    → /api/auth/callback/resend → session created → /tasks
/tasks          → protected; redirects to /signin if no session
/api/tasks/*    → protected; returns 401 if no session
```

The Auth.js Prisma adapter stores sessions and verification tokens in Postgres. No separate Redis or JWT secret needed beyond `AUTH_SECRET`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server with HMR |
| `npm run build` | Generate Prisma client + production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm test` | Run Vitest unit/integration tests (requires DB) |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma db seed` | Re-run the seed script |
| `npx prisma studio` | Open Prisma's visual DB browser |

## Project structure

```
app/
  (auth)/
    layout.tsx           # Redirects signed-in users to /tasks
    signin/
      page.tsx           # Email form (server component + server action)
      verify/page.tsx    # "Check your email" page
  (app)/
    layout.tsx           # Auth guard — redirects to /signin if no session
    tasks/
      page.tsx           # Server component: fetches tasks + projects
      _components/       # Colocated client components and hooks
  page.tsx               # Dispatch: → /tasks or → /signin
  providers.tsx          # TanStack Query + Sonner toast
lib/
  auth.ts                # Auth.js config (Resend + PrismaAdapter)
  api.ts                 # Shared API response helpers
  db/
    index.ts             # Prisma client singleton
    tasks.ts             # Task data-access layer
    tasks.test.ts        # Vitest integration tests
  validations/
    tasks.ts             # Zod schemas
  query-client.ts        # TanStack QueryClient factory
  utils.ts               # cn() helper
types/
  index.ts               # Client-safe serialised types (dates as strings)
prisma/
  schema.prisma          # DB schema (User, Task, Project + Auth.js tables)
  seed.ts                # Dev seed: 1 user, 2 projects, 8 tasks
```
"# tasky" 
