import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Fall back to DATABASE_URL when DIRECT_URL is absent (local dev, or Vercel
// before the env var is explicitly set). Production should set DIRECT_URL to
// POSTGRES_URL_NON_POOLING for the proper pgBouncer / Neon split.
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
