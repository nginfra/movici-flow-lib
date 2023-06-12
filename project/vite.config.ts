import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
        find: "@movici-flow-common",
        replacement: fileURLToPath(new URL("../src", import.meta.url)),
      },
      {
        find: /@deck.gl\/layers$/, replacement: "@deck.gl/layers/dist/esm"
      },
      {
        find: /@deck.gl\/layers\/typed$/, replacement: "@deck.gl/layers/dist/esm"
      }
    ],
  },
});
