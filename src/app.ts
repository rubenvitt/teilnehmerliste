import { readFile } from "./import/load";
import { DEMO_SOURCE, makeDemo } from "./model/demo";
import { mergeChecks } from "./model/merge";
import { norm } from "./model/normalize";
import { parseSheets } from "./model/parse";
import { storage, type Mode } from "./storage";
import type { Group, ListData, Person } from "./types";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const stats = (g: Group) => ({ done: g.people.filter((p) => p.checked).length, total: g.people.length });

let mode: Mode = storage.mode();
let data: ListData | null = storage.list(mode);
let active: string | null = storage.active(mode);
let hideDone = storage.hideDone();
let query = "";
let importError = "";
let busy = false;

function save(): void {
  if (data) storage.setList(mode, data);
  storage.setActive(mode, active);
  storage.setMode(mode);
  storage.setHideDone(hideDone);
}

function clearQuery(): void {
  query = "";
  $<HTMLInputElement>("q").value = "";
}

function currentGroup(): Group | undefined {
  return data?.groups.find((g) => g.id === active);
}

/* Import */

async function handleFile(file: File): Promise<void> {
  importError = "";
  busy = true;
  render();
  try {
    const groups = parseSheets(await readFile(file));
    if (!groups.length) {
      importError = `Keine Namen in „${file.name}“ gefunden. Erwartet: ein Arbeitsblatt pro Gruppe, Namen in der ersten Spalte.`;
      return;
    }
    mergeChecks(groups, storage.list("real"));
    mode = "real";
    data = { groups, source: file.name, importedAt: Date.now() };
    active = groups[0]!.id;
    clearQuery();
    save();
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch (err) {
    console.error(err);
    importError = navigator.onLine
      ? "Datei konnte nicht gelesen werden."
      : "Datei konnte nicht gelesen werden. Ohne Netz fehlt eventuell die Excel-Bibliothek, Seite einmal online laden.";
  } finally {
    busy = false;
    render();
  }
}

/* Demo */

function startDemo(fresh: boolean): void {
  mode = "demo";
  data = (!fresh && storage.list("demo")) || makeDemo();
  active = fresh ? null : storage.active("demo");
  clearQuery();
  importError = "";
  render();
  save();
}

function leaveDemo(): void {
  mode = "real";
  data = storage.list("real");
  active = storage.active("real");
  clearQuery();
  render();
  save();
}

/* Aktionen */

function toggle(gid: string, pid: string): void {
  const p = data?.groups.find((g) => g.id === gid)?.people.find((x) => x.id === pid);
  if (!p) return;
  p.checked = !p.checked;
  save();
  render();
  // Fokus nach dem Neuzeichnen auf derselben Zeile halten (Tastaturbedienung).
  document.querySelector<HTMLElement>(`.row[data-p="${CSS.escape(pid)}"]`)?.focus({ preventScroll: true });
}

function resetGroup(): void {
  currentGroup()?.people.forEach((p) => (p.checked = false));
  save();
  render();
}

function resetAll(): void {
  data?.groups.forEach((g) => g.people.forEach((p) => (p.checked = false)));
  save();
  render();
}

function wipe(): void {
  storage.delList("real");
  data = null;
  active = null;
  clearQuery();
  render();
  save();
}

/** Destruktives erst beim zweiten Tippen innerhalb von drei Sekunden. */
function armed(btn: HTMLElement, run: () => void): void {
  if (btn.classList.contains("armed")) {
    run();
    return;
  }
  const label = btn.textContent;
  btn.classList.add("armed");
  btn.textContent = "Zum Bestätigen erneut tippen";
  setTimeout(() => {
    if (btn.isConnected) {
      btn.classList.remove("armed");
      btn.textContent = label;
    }
  }, 3000);
}

/* Darstellung */

function rowHtml(g: Group, p: Person, showGroup: boolean): string {
  return (
    `<li><button type="button" class="row${p.checked ? " on" : ""}" data-g="${esc(g.id)}" data-p="${esc(p.id)}" role="checkbox" aria-checked="${p.checked}">` +
    `<span class="box" aria-hidden="true"></span>` +
    `<span class="name">${esc(p.name)}${showGroup ? `<span class="grp">${esc(g.name)}</span>` : ""}</span></button></li>`
  );
}

const list = (rows: string[], empty: string) =>
  `<ul class="list">${rows.length ? rows.join("") : `<li class="none">${empty}</li>`}</ul>`;

function renderMenu(has: boolean): void {
  let h = "";
  if (has && data) h += `<div class="info">${esc(data.source || DEMO_SOURCE)}</div>`;
  if (mode === "demo") {
    h += `<button type="button" data-act="reroll">Neue Demo-Daten</button>`;
    h += `<button type="button" data-act="leave">Demo beenden</button>`;
  } else {
    h += `<button type="button" data-act="demo">Demo laden</button>`;
  }
  if (has) {
    h += `<button type="button" data-act="resetGroup" data-confirm>Gruppe zurücksetzen</button>`;
    h += `<button type="button" data-act="resetAll" data-confirm>Alle zurücksetzen</button>`;
    if (mode === "real") h += `<button type="button" data-act="wipe" data-confirm>Liste löschen</button>`;
  }
  $("menuPop").innerHTML = h;
}

export function render(): void {
  const has = !!data?.groups.length;
  $("demoNote").hidden = mode !== "demo";
  $("controls").hidden = !has;
  $<HTMLButtonElement>("importBtn").disabled = busy;
  renderMenu(has);

  const err = importError ? `<p class="err">${esc(importError)}</p>` : "";

  if (!data || !has) {
    $("sub").textContent = "";
    $("main").innerHTML =
      `<div class="empty"><button type="button" class="btn primary" data-act="import"${busy ? " disabled" : ""}>Excel laden</button>` +
      `<button type="button" class="btn" data-act="demo">Demo laden</button></div>${err}`;
    return;
  }

  if (!currentGroup()) active = data.groups[0]!.id;

  let done = 0;
  let total = 0;
  for (const g of data.groups) {
    const s = stats(g);
    done += s.done;
    total += s.total;
  }
  $("sub").textContent = `${done} / ${total}`;

  $("groups").innerHTML = data.groups
    .map((g) => {
      const s = stats(g);
      return `<button type="button" class="tab" data-group="${esc(g.id)}" aria-current="${g.id === active && !query}">${esc(g.name)}<small>${s.done}/${s.total}</small></button>`;
    })
    .join("");

  let html = err;
  if (query) {
    const q = norm(query);
    const hits = data.groups.flatMap((g) => g.people.filter((p) => norm(p.name).includes(q)).map((p) => rowHtml(g, p, true)));
    html += `<div class="ghead"><h2>Suche</h2><span class="count">${hits.length}</span></div>`;
    html += list(hits, "Keine Treffer");
  } else {
    const g = currentGroup()!;
    const s = stats(g);
    const people = hideDone ? g.people.filter((p) => !p.checked) : g.people;
    html +=
      `<div class="ghead"><h2>${esc(g.name)} <span class="count">${s.done} / ${s.total}</span></h2>` +
      `<label class="toggle"><input type="checkbox" id="hideDone"${hideDone ? " checked" : ""}>Erledigte ausblenden</label></div>`;
    html += list(people.map((p) => rowHtml(g, p, false)), "Alles erledigt");
  }
  $("main").innerHTML = html;
}

/* Ereignisse */

function closeMenu(): void {
  $<HTMLDetailsElement>("menu").open = false;
}

export function init(): void {
  const fileInput = $<HTMLInputElement>("file");
  const pickFile = () => {
    if (!busy) fileInput.click();
  };

  $("importBtn").addEventListener("click", pickFile);
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    fileInput.value = "";
    if (f) void handleFile(f);
  });
  $("leaveDemo").addEventListener("click", leaveDemo);
  $<HTMLInputElement>("q").addEventListener("input", (e) => {
    query = (e.target as HTMLInputElement).value.trim();
    render();
  });

  $("groups").addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-group]");
    if (!b) return;
    active = b.dataset.group ?? null;
    clearQuery();
    save();
    render();
    window.scrollTo({ top: 0 });
  });

  $("main").addEventListener("click", (e) => {
    const t = e.target as Element;
    const row = t.closest<HTMLElement>(".row");
    if (row) {
      toggle(row.dataset.g!, row.dataset.p!);
      return;
    }
    const act = t.closest<HTMLElement>("[data-act]")?.dataset.act;
    if (act === "import") pickFile();
    if (act === "demo") startDemo(false);
  });
  $("main").addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === "hideDone") {
      hideDone = t.checked;
      save();
      render();
    }
  });

  $("menuPop").addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-act]");
    if (!b) return;
    const actions: Record<string, () => void> = {
      demo: () => startDemo(false),
      reroll: () => startDemo(true),
      leave: leaveDemo,
      resetGroup,
      resetAll,
      wipe,
    };
    const fn = actions[b.dataset.act ?? ""];
    if (!fn) return;
    const run = () => {
      closeMenu();
      fn();
    };
    if (b.hasAttribute("data-confirm")) armed(b, run);
    else run();
  });

  document.addEventListener("click", (e) => {
    if ($<HTMLDetailsElement>("menu").open && !(e.target as Element).closest("#menu")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $<HTMLDetailsElement>("menu").open) {
      closeMenu();
      $("menu").querySelector("summary")?.focus();
    }
  });

  render();
}
