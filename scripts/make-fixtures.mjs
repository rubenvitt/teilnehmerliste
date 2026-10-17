// Erzeugt die Test-Fixtures in test/fixtures. Alle Namen sind erfunden.
import { mkdirSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const dir = new URL("../test/fixtures/", import.meta.url);
mkdirSync(dir, { recursive: true });

function book(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows, hidden] of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
    if (hidden) {
      wb.Workbook ??= { Sheets: [] };
      wb.Workbook.Sheets[wb.SheetNames.length - 1] = { Hidden: 1 };
    }
  }
  return wb;
}

const varianten = book([
  ["Gruppe 1", [["Name"], ["Lea Beispiel"], ["Ben Muster"], [""], ["Ida Probe"]]],
  ["Gruppe 2", [["Vorname", "Nachname", "Alter"], ["Mila", "Testmann", 12], ["Ole", "Fiktiv", 13]]],
  ["Leer", []],
  ["Nur Kopf", [["Name"]]],
  ["Ohne Kopf", [["Jana Erfunden"], [], ["Theo Ausgedacht"], ["   "], ["Zoe Platzhalter"]]],
  ["Mit Titel", [["Anmeldungen Samstag"], ["Nr.", "Name", "Bemerkung"], [1, "Kian Beispiel", ""], [2, "Nele Muster", "kommt später"]]],
  ["Name Vorname", [["Name", "Vorname"], ["Probe", "Emil"], ["Testfrau", "Greta"]]],
  ["Intern", [["Name"], ["Geheim Versteckt"]], true],
]);
for (const ext of ["xlsx", "ods", "xls"]) {
  writeFileSync(new URL(`varianten.${ext}`, dir), XLSX.write(varianten, { type: "buffer", bookType: ext === "xls" ? "biff8" : ext, compression: true }));
}

writeFileSync(
  new URL("gruppe-c.csv", dir),
  "Vorname;Nachname\nJürgen;Größe\nÖzlem;Ärmel\n;\nRené;Çelik\n",
);

// Export aus deutschem Excel („CSV (Trennzeichen-getrennt)“): Windows-1252
writeFileSync(
  new URL("gruppe-d-cp1252.csv", dir),
  Buffer.from("Name;Vorname\nMüller;Jörg\nStraße;Anaïs\n", "latin1"),
);
