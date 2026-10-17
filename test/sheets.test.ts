import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readWorkbook, UnreadableFileError } from "../src/import/sheets";
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

  it("liest CSV in Windows-1252 aus deutschem Excel", () => {
    expect(load("gruppe-d-cp1252.csv")).toEqual([["gruppe-d-cp1252", ["Jörg Müller", "Anaïs Straße"]]]);
  });

  it("lehnt eine .xlsx ab, die keine ist", () => {
    const junk = new TextEncoder().encode("das ist keine Tabelle");
    expect(() => readWorkbook(XLSX, junk, "kaputt.xlsx")).toThrow(UnreadableFileError);
  });

  it("behält führende Nullen und lange Zahlen in CSV als Text", () => {
    const csv = new TextEncoder().encode("Name\n007 Agent\n");
    expect(parseSheets(readWorkbook(XLSX, csv, "x.csv"))[0]!.people[0]!.name).toBe("007 Agent");
  });

  it("meldet keine Gruppen für Dateien ohne Namen", () => {
    const csv = new TextEncoder().encode("\n;\n");
    expect(parseSheets(readWorkbook(XLSX, csv, "leer.csv"))).toEqual([]);
  });
});
