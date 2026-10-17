import type { Group, IdFn, Person, SheetRows } from "../types";
import { cell, norm, uid } from "./normalize";

const NAME = /^(name|namen|teilnehmer|teilnehmerin|teilnehmende|teilnehmer\*in|teilnehmer:in|person)$/;
const FIRST = /^(vorname|vornamen)$/;
const LAST = /^(nachname|nachnamen|familienname|zuname)$/;
/** Spalte mit Häkchen, etwa aus einem früheren Export. */
const CHECK = /^(abgehakt|da|anwesend|erledigt|check-in|checkin)$/;
const YES = /^(x|ja|j|1|true|wahr|✓|✔|☑)$/;

/** So viele Zeilen werden nach einer Kopfzeile durchsucht (z. B. unter einer Titelzeile). */
const HEADER_SCAN = 5;

interface Columns {
  headerRow: number;
  name: number;
  first: number;
  last: number;
  check: number;
}

function findColumns(rows: unknown[][]): Columns | null {
  const limit = Math.min(rows.length, HEADER_SCAN);
  for (let r = 0; r < limit; r++) {
    const head = (rows[r] ?? []).map((c) => norm(cell(c)));
    const name = head.findIndex((h) => NAME.test(h));
    const first = head.findIndex((h) => FIRST.test(h));
    const last = head.findIndex((h) => LAST.test(h));
    const check = head.findIndex((h) => CHECK.test(h));
    if (name >= 0 || first >= 0 || last >= 0) return { headerRow: r, name, first, last, check };
  }
  return null;
}

/** Ohne Kopfzeile: erste nicht leere Zelle, reine Nummern (lfd. Nr.) übersprungen. */
function firstText(row: unknown[]): string {
  for (const c of row) {
    const v = cell(c);
    if (v && !/^\d+[.)]?$/.test(v)) return v;
  }
  return "";
}

function nameFrom(row: unknown[], cols: Columns | null): string {
  if (!cols) return firstText(row);
  if (cols.first >= 0 && cols.last >= 0) {
    return `${cell(row[cols.first])} ${cell(row[cols.last])}`.trim();
  }
  // „Name“ neben „Vorname“ ist in deutschen Listen der Nachname.
  if (cols.name >= 0 && cols.first >= 0) {
    return `${cell(row[cols.first])} ${cell(row[cols.name])}`.trim();
  }
  if (cols.name >= 0) return cell(row[cols.name]);
  return cell(row[cols.first >= 0 ? cols.first : cols.last]);
}

/** Ein Arbeitsblatt = eine Gruppe. Blätter ohne Namen fallen weg. */
export function parseSheets(sheets: SheetRows[], id: IdFn = uid): Group[] {
  const groups: Group[] = [];
  for (const sheet of sheets) {
    const rows = sheet.rows.filter((r) => Array.isArray(r) && r.some((c) => cell(c) !== ""));
    if (!rows.length) continue;
    const cols = findColumns(rows);
    const body = cols ? rows.slice(cols.headerRow + 1) : rows;
    const people: Person[] = [];
    for (const row of body) {
      const name = nameFrom(row, cols);
      const checked = !!cols && cols.check >= 0 && YES.test(norm(cell(row[cols.check])));
      if (name) people.push({ id: id(), name, checked });
    }
    if (people.length) groups.push({ id: id(), name: cell(sheet.name) || "Gruppe", people });
  }
  return groups;
}
