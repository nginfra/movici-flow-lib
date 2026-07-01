import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        // Inject flow-lib's own variables so its scoped styles compile standalone
        // (no consumer-side additionalData) — the decoupling canary.
        additionalData: `@use "@movici-flow-lib/assets/sass/variables" as *;\n`,
        silenceDeprecations: ["import", "color-functions", "global-builtin"],
      },
    },
  },
  build: {
    target: "ES2021",
    chunkSizeWarningLimit: 1024,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    port: 8080,
  },
  resolve: {
    alias: [
      {
        find: "@movici-flow-lib",
        replacement: fileURLToPath(new URL("../src", import.meta.url)),
      },
    ],
  },
});
