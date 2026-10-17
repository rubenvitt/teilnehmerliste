import type { Group, ListData } from "../types";
import { norm } from "./normalize";

const key = (group: string, person: string) => `${norm(group)}|${norm(person)}`;

/**
 * Übernimmt Häkchen aus einer früheren Liste. Abgleich über normalisierten
 * Gruppen- und Personennamen; bei gleichnamigen Personen in einer Gruppe
 * werden höchstens so viele abgehakt, wie vorher abgehakt waren.
 */
export function mergeChecks(groups: Group[], old: ListData | null | undefined): number {
  if (!old?.groups) return 0;
  const counts = new Map<string, number>();
  for (const g of old.groups) {
    for (const p of g.people) {
      if (!p.checked) continue;
      const k = key(g.name, p.name);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  let merged = 0;
  for (const g of groups) {
    for (const p of g.people) {
      const k = key(g.name, p.name);
      const n = counts.get(k) ?? 0;
      if (n > 0) {
        p.checked = true;
        counts.set(k, n - 1);
        merged++;
      }
    }
  }
  return merged;
}
