/**
 * Creates a real database session for the E2E test user so tests don't
 * have to go through the full magic-link email flow.
 *
 * Requires DATABASE_URL to be set in .env.local / environment.
 * Skips (reuses) the saved auth state if it already exists and is less than
 * 12 hours old to speed up repeated local runs.
 */
import "dotenv/config";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");
const E2E_EMAIL = "test-e2e@tasky.local";

export default async function globalSetup() {
  // Reuse saved state if fresh (< 12 h)
  if (fs.existsSync(AUTH_FILE)) {
    const age = Date.now() - fs.statSync(AUTH_FILE).mtimeMs;
    if (age < 12 * 60 * 60 * 1000) return;
  }

  const db = new PrismaClient();
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Create (or refresh) the test user
    const user = await db.user.upsert({
      where: { email: E2E_EMAIL },
      create: {
        email: E2E_EMAIL,
        name: "E2E Test",
        emailVerified: new Date(),
      },
      update: { emailVerified: new Date() },
    });

    // Create a 24-hour database session
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Clean up any old test sessions first
    await db.session.deleteMany({ where: { userId: user.id } });

    await db.session.create({
      data: { sessionToken, userId: user.id, expires },
    });

    // Inject the session cookie so the browser is "logged in"
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        expires: Math.floor(expires.getTime() / 1000),
      },
    ]);

    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    await context.storageState({ path: AUTH_FILE });
  } finally {
    await db.$disconnect();
    await context.close();
    await browser.close();
  }
}
