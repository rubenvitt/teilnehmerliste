export interface Person {
  id: string;
  name: string;
  checked: boolean;
}

export interface Group {
  id: string;
  name: string;
  people: Person[];
}

export interface ListData {
  groups: Group[];
  source: string;
  importedAt: number;
}

/** Ein Arbeitsblatt als Zeilen von Zellwerten, unabhängig von SheetJS. */
export interface SheetRows {
  name: string;
  rows: unknown[][];
}

export type IdFn = () => string;
