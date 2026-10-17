import type { ListData } from "../types";
import { uid } from "./normalize";

const FIRST = ["Lea","Mia","Emma","Hannah","Sophie","Lina","Marie","Clara","Paula","Greta","Mila","Jana","Nele","Amelie","Luisa","Zoe","Ben","Paul","Finn","Leon","Noah","Elias","Jonas","Luca","Mats","Theo","Anton","Emil","Ole","Yusuf","Aylin","Elif","Sara","Milan","Deniz","Kian","Malik","Selin","Jamal","Ivana"];
const LAST = ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Koch","Richter","Klein","Wolf","Schröder","Neumann","Braun","Zimmermann","Krüger","Hartmann","Lange","Werner","Lehmann","Yilmaz","Kaya","Nowak","Peters","Brandt","Demir","Öztürk"];
const GROUPS = ["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D", "Gruppe E", "Gruppe F"];

export const DEMO_SOURCE = "Demo-Daten";

/** Zufällige, erfundene Namen in den Gruppen A–F; etwa ein Drittel schon abgehakt. */
export function makeDemo(random: () => number = Math.random): ListData {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
  const used = new Set<string>();
  const groups = GROUPS.map((name) => {
    const size = 8 + Math.floor(random() * 15);
    const people: { first: string; last: string }[] = [];
    while (people.length < size) {
      const p = { first: pick(FIRST), last: pick(LAST) };
      const key = `${p.first} ${p.last}`;
      if (used.has(key)) continue;
      used.add(key);
      people.push(p);
    }
    people.sort((a, b) => a.last.localeCompare(b.last, "de") || a.first.localeCompare(b.first, "de"));
    return {
      id: uid(),
      name,
      people: people.map((p) => ({ id: uid(), name: `${p.first} ${p.last}`, checked: random() < 0.3 })),
    };
  });
  return { groups, source: DEMO_SOURCE, importedAt: Date.now() };
}
