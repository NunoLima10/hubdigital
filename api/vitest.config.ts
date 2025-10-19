import { defineConfig } from "vitest/config";
import path from "node:path";


export default defineConfig({
    resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup-env.ts"],
    include: ["tests/**/*.test.ts"],
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
