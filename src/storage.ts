import type { ListData } from "./types";

const PREFIX = "teilnehmerliste.v1.";

export type Mode = "real" | "demo";

function get(key: string): unknown {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Speicher voll oder gesperrt: die Liste läuft im Speicher weiter.
  }
}

function del(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignorieren
  }
}

const isStr = (v: unknown): v is string => typeof v === "string";

/** Prüft die Form, damit kaputte oder alte Einträge die App nicht lahmlegen. */
function asList(v: unknown): ListData | null {
  if (!v || typeof v !== "object") return null;
  const d = v as Partial<ListData>;
  if (!Array.isArray(d.groups)) return null;
  const groups = d.groups.filter(
    (g) =>
      g && isStr(g.id) && isStr(g.name) && Array.isArray(g.people) &&
      g.people.every((p) => p && isStr(p.id) && isStr(p.name) && typeof p.checked === "boolean"),
  );
  if (!groups.length) return null;
  return { groups, source: isStr(d.source) ? d.source : "", importedAt: Number(d.importedAt) || 0 };
}

export const storage = {
  mode: (): Mode => (get("mode") === "demo" ? "demo" : "real"),
  setMode: (m: Mode) => set("mode", m),
  list: (m: Mode) => asList(get(m)),
  setList: (m: Mode, d: ListData) => set(m, d),
  delList: (m: Mode) => {
    del(m);
    del(`active.${m}`);
  },
  active: (m: Mode): string | null => {
    const v = get(`active.${m}`);
    return isStr(v) ? v : null;
  },
  setActive: (m: Mode, id: string | null) => set(`active.${m}`, id),
  hideDone: () => get("hideDone") === true,
  setHideDone: (v: boolean) => set("hideDone", v),
};
