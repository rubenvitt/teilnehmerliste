import { describe, expect, it } from "vitest";
import { makeDemo } from "../src/model/demo";

describe("makeDemo", () => {
  it("erzeugt die Gruppen A–F mit eindeutigen Namen", () => {
    const d = makeDemo();
    expect(d.groups.map((g) => g.name)).toEqual(["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D", "Gruppe E", "Gruppe F"]);
    const names = d.groups.flatMap((g) => g.people.map((p) => p.name));
    expect(new Set(names).size).toBe(names.length);
    for (const g of d.groups) expect(g.people.length).toBeGreaterThanOrEqual(8);
  });
});
