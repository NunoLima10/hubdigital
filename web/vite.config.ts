import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": src("./src"),
      "@app": src("./src/app"),
      "@assets": src("./src/assets"),
    },
  },
  // tanstackStart() also generates the route tree, so the standalone router
  // plugin is gone. Order matters: cloudflare, then Start, then React.
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
});
