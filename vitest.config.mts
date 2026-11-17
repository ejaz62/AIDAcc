import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the React Server environment; it is a no-op in tests.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests share one database; run files sequentially.
    fileParallelism: false,
    // Database tests may run against a remote database (e.g. Supabase), where each
    // round trip can take hundreds of milliseconds.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
