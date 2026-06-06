// Load .env so DATABASE_URL is available when tests spin up the Prisma client.
// Set TEST_DATABASE_URL to point at a separate test database if desired.
import "dotenv/config";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
