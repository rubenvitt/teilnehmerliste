import type { WorkBook } from "xlsx";
import type { SheetRows } from "../types";

type XLSX = typeof import("xlsx");

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

/** CSV aus deutschem Excel ist oft Windows-1252, sonst UTF-8. */
export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

const ZIP = /\.(xlsx|xlsm|ods)$/i;
const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b;

export class UnreadableFileError extends Error {}

export function readWorkbook(X: XLSX, data: ArrayBuffer | Uint8Array, fileName: string): SheetRows[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Sonst liest SheetJS eine falsche Datei klaglos als Text ein.
  if (ZIP.test(fileName) && !isZip(bytes)) throw new UnreadableFileError(fileName);
  const wb = /\.csv$/i.test(fileName)
    ? X.read(decodeText(bytes), { type: "string", dense: true, raw: true })
    : X.read(bytes, { type: "array", dense: true, cellDates: true });
  return workbookToSheets(X, wb, fileName);
}
