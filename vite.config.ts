import { fileURLToPath, URL } from "node:url";
import { resolve, relative, extname, isAbsolute } from "node:path";
import { globSync } from "glob";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    // Internal-only alias: keeps the ~319 `@movici-flow-lib/*` self-imports working.
    // Resolved into the build graph; never emitted into dist.
    alias: [{ find: "@movici-flow-lib", replacement: src }],
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        // THE decoupling line: inject flow-lib's own variables/mixins into every
        // <style lang="scss"> block and every JS-imported .scss entry, so the lib's
        // scoped styles compile standalone with no consumer-side injection.
        additionalData: `@use "@movici-flow-lib/assets/sass/variables" as *;\n`,
        // TODO: remove once flow-lib's SCSS is migrated off legacy Sass (dart-sass v3).
        silenceDeprecations: ["import", "color-functions", "global-builtin"],
      },
    },
  },

  plugins: [
    vue(),
    libInjectCss(),
    dts({
      tsconfigPath: "tsconfig.lib.json",
      include: ["src"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/__mocks__/**",
        "src/**/*.spec.ts",
        "src/**/*.test.ts",
      ],
      entryRoot: "src",
      insertTypesEntry: true,
      rollupTypes: false,
    }),
  ],

  build: {
    target: "ES2021",
    cssCodeSplit: true,
    copyPublicDir: false,
    lib: {
      entry: resolve(src, "index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize every bare (node_modules) import — peers AND dependencies —
      // so the consumer bundles them and handles CJS interop (e.g. vuedraggable's
      // UMD `require('vue')`). Keep relative/absolute (alias-resolved internal)
      // and the raw internal `@movici-flow-lib` alias bundled.
      external: (id) =>
        !id.startsWith(".") && !isAbsolute(id) && !id.startsWith("@movici-flow-lib"),
      // Multi-entry: one entry per source file → preserves structure + per-file CSS.
      input: Object.fromEntries(
        globSync("src/**/*.{ts,vue}", {
          ignore: [
            "src/**/*.d.ts",
            "src/**/__tests__/**",
            "src/**/__mocks__/**",
            "src/**/*.spec.ts",
            "src/**/*.test.ts",
          ],
        }).map((file) => [
          relative("src", file.slice(0, file.length - extname(file).length)),
          fileURLToPath(new URL(file, import.meta.url)),
        ]),
      ),
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },

  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
