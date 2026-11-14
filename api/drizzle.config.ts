import { config } from "@/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schemas/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
