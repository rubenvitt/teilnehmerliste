import { describe, expect, it } from "vitest";
import { mergeChecks } from "../src/model/merge";
import type { Group, ListData } from "../src/types";

let n = 0;
const group = (name: string, people: [string, boolean?][]): Group => ({
  id: `g${++n}`,
  name,
  people: people.map(([pn, checked]) => ({ id: `p${++n}`, name: pn, checked: !!checked })),
});
const list = (...groups: Group[]): ListData => ({ groups, source: "alt.xlsx", importedAt: 0 });
const checked = (groups: Group[]) =>
  groups.flatMap((g) => g.people.filter((p) => p.checked).map((p) => `${g.name}/${p.name}`));

describe("mergeChecks", () => {
  it("übernimmt Häkchen bei gleicher Gruppe und gleichem Namen", () => {
    const old = list(group("Gruppe 1", [["Lea Beispiel", true], ["Ben Muster"]]));
    const fresh = [group("Gruppe 1", [["Lea Beispiel"], ["Ben Muster"], ["Ida Probe"]])];
    expect(mergeChecks(fresh, old)).toBe(1);
    expect(checked(fresh)).toEqual(["Gruppe 1/Lea Beispiel"]);
  });

  it("ignoriert Groß-/Kleinschreibung, Akzente und Leerraum", () => {
    const old = list(group("gruppe  1 ", [["René Çelik", true]]));
    const fresh = [group("Gruppe 1", [["rene  celik"]])];
    mergeChecks(fresh, old);
    expect(checked(fresh)).toEqual(["Gruppe 1/rene  celik"]);
  });

  it("hakt nicht in einer anderen Gruppe ab", () => {
    const old = list(group("Gruppe 1", [["Lea Beispiel", true]]));
    const fresh = [group("Gruppe 2", [["Lea Beispiel"]])];
    expect(mergeChecks(fresh, old)).toBe(0);
    expect(checked(fresh)).toEqual([]);
  });

  it("verteilt Häkchen bei gleichnamigen Personen nach Anzahl", () => {
    const old = list(group("A", [["Ben", true], ["Ben"]]));
    const fresh = [group("A", [["Ben"], ["Ben"], ["Ben"]])];
    expect(mergeChecks(fresh, old)).toBe(1);
  });

  it("tut nichts ohne alte Liste", () => {
    const fresh = [group("A", [["Ben"]])];
    expect(mergeChecks(fresh, null)).toBe(0);
    expect(checked(fresh)).toEqual([]);
  });
});
