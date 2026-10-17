import type { WorkBook } from "xlsx";
import type { ListData } from "../types";

type XLSX = typeof import("xlsx");

/** Blattnamen: höchstens 31 Zeichen, keine Sonderzeichen []:*?/\, nicht mit ' am Rand, eindeutig. */
function sheetName(name: string, used: Set<string>): string {
  const clean = name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").replace(/^'+|'+$/g, "").trim();
  const base = (clean || "Gruppe").slice(0, 31);
  let out = base;
  for (let n = 2; used.has(out.toLowerCase()); n++) {
    const suffix = ` (${n})`;
    out = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(out.toLowerCase());
  return out;
}

/** Ein Blatt pro Gruppe mit den Spalten Name und Abgehakt („x“ oder leer). */
export function buildExport(X: XLSX, data: ListData): WorkBook {
  const wb = X.utils.book_new();
  const used = new Set<string>();
  for (const g of data.groups) {
    const rows = [["Name", "Abgehakt"], ...g.people.map((p) => [p.name, p.checked ? "x" : null])];
    const ws = X.utils.aoa_to_sheet(rows);
    const width = Math.min(60, Math.max(10, ...g.people.map((p) => p.name.length)) + 2);
    ws["!cols"] = [{ wch: width }, { wch: 10 }];
    X.utils.book_append_sheet(wb, ws, sheetName(g.name, used));
  }
  return wb;
}

export function exportFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `teilnehmerliste-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.xlsx`;
}

export function exportBytes(X: XLSX, data: ListData): ArrayBuffer {
  return X.write(buildExport(X, data), { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer;
}
