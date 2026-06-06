import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Tests hit a real database — run serially to avoid inter-test races.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15_000,
  },
});
