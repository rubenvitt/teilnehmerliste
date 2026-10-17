import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildExport, exportBytes, exportFileName } from "../src/import/export";
import { readWorkbook } from "../src/import/sheets";
import { parseSheets } from "../src/model/parse";
import type { ListData } from "../src/types";

const data: ListData = {
  source: "test.xlsx",
  importedAt: 0,
  groups: [
    { id: "g1", name: "Gruppe 1", people: [{ id: "a", name: "Lea Beispiel", checked: true }, { id: "b", name: "Ben Muster", checked: false }] },
    { id: "g2", name: "Gruppe/2: [Abend]", people: [{ id: "c", name: "Ida Probe", checked: true }] },
    { id: "g3", name: "gruppe 1", people: [{ id: "d", name: "Ole Fiktiv", checked: false }] },
    { id: "g4", name: "Eine sehr lange Gruppenbezeichnung mit Überlänge", people: [{ id: "e", name: "Zoe Platzhalter", checked: false }] },
  ],
};

describe("Export", () => {
  it("legt ein Blatt pro Gruppe mit Name und Abgehakt an", () => {
    const wb = buildExport(XLSX, data);
    expect(wb.SheetNames).toEqual(["Gruppe 1", "Gruppe 2 Abend", "gruppe 1 (2)", "Eine sehr lange Gruppenbezeichn"]);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Gruppe 1"]!, { header: 1 });
    expect(rows).toEqual([["Name", "Abgehakt"], ["Lea Beispiel", "x"], ["Ben Muster"]]);
  });

  it("lässt sich wieder importieren, Häkchen inklusive", () => {
    const bytes = new Uint8Array(exportBytes(XLSX, data));
    const groups = parseSheets(readWorkbook(XLSX, bytes, "export.xlsx"));
    expect(groups.map((g) => g.people.map((p) => [p.name, p.checked]))).toEqual([
      [["Lea Beispiel", true], ["Ben Muster", false]],
      [["Ida Probe", true]],
      [["Ole Fiktiv", false]],
      [["Zoe Platzhalter", false]],
    ]);
  });

  it("benennt die Datei nach dem Datum", () => {
    expect(exportFileName(new Date(2026, 9, 7))).toBe("teilnehmerliste-2026-10-07.xlsx");
  });
});
