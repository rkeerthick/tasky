import { PrismaClient } from "@prisma/client";

// DIRECT_URL is only required in production (Neon/pgBouncer environments).
// For local dev, fall back to DATABASE_URL so the Prisma client doesn't crash
// when DIRECT_URL isn't in .env.local.
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
