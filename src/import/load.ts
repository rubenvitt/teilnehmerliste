import type { SheetRows } from "../types";

/** SheetJS erst bei Bedarf laden, damit der Start schnell bleibt. */
const xlsx = () => import("xlsx");

export async function readFile(file: File): Promise<SheetRows[]> {
  const [X, { readWorkbook }, data] = await Promise.all([xlsx(), import("./sheets"), file.arrayBuffer()]);
  return readWorkbook(X, data, file.name);
}
