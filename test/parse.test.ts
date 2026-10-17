import { describe, expect, it } from "vitest";
import { parseSheets } from "../src/model/parse";
import type { SheetRows } from "../src/types";

const ids = () => {
  let n = 0;
  return () => `id${++n}`;
};
const names = (sheets: SheetRows[]) =>
  parseSheets(sheets, ids()).map((g) => [g.name, g.people.map((p) => p.name)]);

describe("parseSheets", () => {
  it("nimmt ohne Kopfzeile die erste Spalte", () => {
    expect(names([{ name: "A", rows: [["Lea Beispiel"], ["Ben Muster"]] }])).toEqual([
      ["A", ["Lea Beispiel", "Ben Muster"]],
    ]);
  });

  it("überspringt laufende Nummern ohne Kopfzeile", () => {
    expect(names([{ name: "A", rows: [[1, "Lea Beispiel"], ["2.", "Ben Muster"]] }])).toEqual([
      ["A", ["Lea Beispiel", "Ben Muster"]],
    ]);
  });

  it("erkennt die Kopfzeile „Name“ in beliebiger Spalte", () => {
    const rows = [["Nr", "NAME ", "Alter"], [1, "Lea Beispiel", 12], [2, "Ben Muster", 13]];
    expect(names([{ name: "A", rows }])).toEqual([["A", ["Lea Beispiel", "Ben Muster"]]]);
  });

  it("setzt Vorname und Nachname zusammen", () => {
    const rows = [["Nachname", "Vorname"], ["Muster", "Ben"], ["", "Ida"], ["Probe", ""]];
    expect(names([{ name: "A", rows }])).toEqual([["A", ["Ben Muster", "Ida", "Probe"]]]);
  });

  it("liest „Name“ neben „Vorname“ als Nachname", () => {
    const rows = [["Name", "Vorname"], ["Muster", "Ben"]];
    expect(names([{ name: "A", rows }])).toEqual([["A", ["Ben Muster"]]]);
  });

  it("nimmt die Spalte, wenn nur „Vorname“ da ist", () => {
    expect(names([{ name: "A", rows: [["Vorname", "Gruppe"], ["Ben", "X"]] }])).toEqual([["A", ["Ben"]]]);
  });

  it("findet die Kopfzeile unter einer Titelzeile", () => {
    const rows = [["Anmeldungen"], [], ["Name"], ["Lea Beispiel"]];
    expect(names([{ name: "A", rows }])).toEqual([["A", ["Lea Beispiel"]]]);
  });

  it("ignoriert leere Zeilen und Leerraum", () => {
    const rows = [["Name"], [], ["  Lea   Beispiel "], ["", ""], [null], ["Ben Muster"]];
    expect(names([{ name: "A", rows }])).toEqual([["A", ["Lea Beispiel", "Ben Muster"]]]);
  });

  it("lässt leere Blätter und Blätter nur mit Kopfzeile weg", () => {
    const sheets = [
      { name: "Leer", rows: [] },
      { name: "Nur Kopf", rows: [["Name"]] },
      { name: "Nur Leerzeilen", rows: [[""], ["  "]] },
      { name: "B", rows: [["Ben Muster"]] },
    ];
    expect(names(sheets)).toEqual([["B", ["Ben Muster"]]]);
  });

  it("vergibt einen Ersatznamen für Blätter ohne Namen", () => {
    expect(names([{ name: "  ", rows: [["Ben"]] }])).toEqual([["Gruppe", ["Ben"]]]);
  });

  it("behält gleichnamige Personen und vergibt eindeutige IDs", () => {
    const groups = parseSheets([{ name: "A", rows: [["Ben"], ["Ben"]] }], ids());
    const people = groups[0]!.people;
    expect(people.map((p) => p.name)).toEqual(["Ben", "Ben"]);
    expect(new Set(people.map((p) => p.id)).size).toBe(2);
    expect(people.every((p) => !p.checked)).toBe(true);
  });
});
