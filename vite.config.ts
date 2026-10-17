import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    // Kein Inline-Code im HTML, damit die strikte CSP ohne 'unsafe-inline' auskommt.
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
