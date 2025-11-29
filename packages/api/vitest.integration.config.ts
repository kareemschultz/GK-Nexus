/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-integration",
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/integration-setup.ts"],
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 30_000,
    maxConcurrency: 1, // Run integration tests sequentially
    sequence: {
      hooks: "stack", // Ensure proper teardown
    },
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
