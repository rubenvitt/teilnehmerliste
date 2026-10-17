import type { ListData, SheetRows } from "../types";

/** SheetJS erst bei Bedarf laden, damit der Start schnell bleibt. */
const xlsx = () => import("xlsx");

export async function readFile(file: File): Promise<SheetRows[]> {
  const [X, { readWorkbook }, data] = await Promise.all([xlsx(), import("./sheets"), file.arrayBuffer()]);
  return readWorkbook(X, data, file.name);
}

/** Erzeugt die Datei im Browser und bietet sie zum Speichern an. Nichts verlässt das Gerät. */
export async function downloadExport(data: ListData): Promise<void> {
  const [X, { exportBytes, exportFileName }] = await Promise.all([xlsx(), import("./export")]);
  const blob = new Blob([exportBytes(X, data)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
