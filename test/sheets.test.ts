import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readWorkbook } from "../src/import/sheets";
import { parseSheets } from "../src/model/parse";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
const load = (name: string) =>
  parseSheets(readWorkbook(XLSX, fixture(name), name)).map((g) => [g.name, g.people.map((p) => p.name)]);

const VARIANTEN = [
  ["Gruppe 1", ["Lea Beispiel", "Ben Muster", "Ida Probe"]],
  ["Gruppe 2", ["Mila Testmann", "Ole Fiktiv"]],
  ["Ohne Kopf", ["Jana Erfunden", "Theo Ausgedacht", "Zoe Platzhalter"]],
  ["Mit Titel", ["Kian Beispiel", "Nele Muster"]],
  ["Name Vorname", ["Emil Probe", "Greta Testfrau"]],
];

describe("Import aus Dateien", () => {
  it.each(["varianten.xlsx", "varianten.xls"])("liest %s: ein Blatt pro Gruppe, ohne leere und ausgeblendete", (f) => {
    expect(load(f)).toEqual(VARIANTEN);
  });

  // Der SheetJS-Writer speichert das Ausblenden für .ods nicht mit,
  // dort kommt das Blatt „Intern“ daher als normale Gruppe an.
  it("liest .ods", () => {
    const f = "varianten.ods";
    expect(load(f)).toEqual([...VARIANTEN, ["Intern", ["Geheim Versteckt"]]]);
  });

  it("liest CSV mit Semikolon und Umlauten, Gruppe heißt wie die Datei", () => {
    expect(load("gruppe-c.csv")).toEqual([["gruppe-c", ["Jürgen Größe", "Özlem Ärmel", "René Çelik"]]]);
  });

  it("meldet keine Gruppen für Dateien ohne Namen", () => {
    const csv = new TextEncoder().encode("\n;\n");
    expect(parseSheets(readWorkbook(XLSX, csv, "leer.csv"))).toEqual([]);
  });
});
