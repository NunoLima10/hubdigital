import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": src("./src"),
      "@app": src("./src/app"),
      "@assets": src("./src/assets"),
    },
  },
  // tanstackStart() also generates the route tree, so the standalone router
  // plugin is gone. It has to come before the React plugin.
  plugins: [tanstackStart(), viteReact()],
});
