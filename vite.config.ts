import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const NO_CACHE = new Set(["_headers", "robots.txt", "sw.js"]);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/** Schreibt dist/sw.js mit der Liste aller Build-Dateien und einer Version aus deren Inhalt. */
function serviceWorker(): Plugin {
  let outDir = "dist";
  return {
    name: "teilnehmerliste-sw",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const hash = createHash("sha256");
      const urls: string[] = [];
      for (const file of files(outDir).sort()) {
        const rel = relative(outDir, file).split(sep).join("/");
        if (NO_CACHE.has(rel)) continue;
        hash.update(rel).update(readFileSync(file));
        // Cloudflare Pages leitet /index.html auf / um, umgeleitete Antworten taugen nicht für Navigationen.
        urls.push(rel === "index.html" ? "./" : `./${rel}`);
      }
      const sw = readFileSync("sw/sw.js", "utf8")
        .replace("__VERSION__", hash.digest("hex").slice(0, 12))
        .replace("__PRECACHE__", JSON.stringify(urls));
      writeFileSync(join(outDir, "sw.js"), sw);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [serviceWorker()],
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
