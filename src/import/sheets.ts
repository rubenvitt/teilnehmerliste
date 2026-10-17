import type { WorkBook } from "xlsx";
import type { SheetRows } from "../types";

type XLSX = typeof import("xlsx");

export const ACCEPT = ".xlsx,.xls,.xlsm,.ods,.csv";

/** Arbeitsblätter als Zeilen. Ausgeblendete Blätter fallen weg, eine CSV heißt wie die Datei. */
export function workbookToSheets(X: XLSX, wb: WorkBook, fileName: string): SheetRows[] {
  const meta = wb.Workbook?.Sheets ?? [];
  const sheets: SheetRows[] = [];
  wb.SheetNames.forEach((name, i) => {
    if (meta[i]?.Hidden) return;
    const ws = wb.Sheets[name];
    if (!ws) return;
    const rows = X.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: "", raw: false });
    sheets.push({ name, rows });
  });
  if (/\.csv$/i.test(fileName) && sheets.length === 1 && sheets[0]) {
    sheets[0].name = fileName.replace(/\.csv$/i, "");
  }
  return sheets;
}

export function readWorkbook(X: XLSX, data: ArrayBuffer | Uint8Array, fileName: string): SheetRows[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const wb = X.read(bytes, { type: "array", dense: true, cellDates: true, codepage: 65001 });
  return workbookToSheets(X, wb, fileName);
}
