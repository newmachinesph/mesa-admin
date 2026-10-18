// Pure helpers for the floor-plan editor. No React, no store — just table math.
import { minutesOf, turnMinutes, type Reservation, type Table } from '@/core';

export const GRID_COLS = 12;
export const GRID_ROWS = 8;

// Manila is a fixed +08:00 offset — no DST, ever. Current wall-clock minutes.
export function nowManilaMinutes(): number {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// tableId -> guest name for tables actively occupied at `nowMin` today.
// Mirrors availability's blocking rule (cancelled / no_show never hold a table)
// and drops completed sittings — the guest has already left.
export function occupiedTableMap(reservations: Reservation[], nowMin: number): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of reservations) {
    if (r.status === 'cancelled' || r.status === 'no_show' || r.status === 'completed') continue;
    const start = minutesOf(r.time);
    if (nowMin < start || nowMin >= start + turnMinutes(r.partySize)) continue;
    for (const id of r.tableIds) if (!map.has(id)) map.set(id, r.name);
  }
  return map;
}

// Which grid cell a pointer sits over, clamped to the board.
export function cellFromPointer(rect: DOMRect, clientX: number, clientY: number) {
  const x = Math.floor(((clientX - rect.left) / rect.width) * GRID_COLS);
  const y = Math.floor(((clientY - rect.top) / rect.height) * GRID_ROWS);
  return {
    x: Math.max(0, Math.min(GRID_COLS - 1, x)),
    y: Math.max(0, Math.min(GRID_ROWS - 1, y)),
  };
}

// Touching cells (orthogonal or diagonal). Combinability is only offered for these.
export function areAdjacent(a: Table, b: Table): boolean {
  const dx = Math.abs(a.gridX - b.gridX);
  const dy = Math.abs(a.gridY - b.gridY);
  return Math.max(dx, dy) === 1;
}

const linked = (a: Table, b: Table): boolean =>
  a.combinableWith.includes(b.id) || b.combinableWith.includes(a.id);

export interface ZoneStats {
  tableCount: number;
  totalSeats: number;
  largestSeatable: number;
}

// Largest party = biggest single table, or the biggest fully-combinable cluster.
export function zoneStats(tables: Table[]): ZoneStats {
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  let largest = 0;
  const seen = new Set<string>();
  for (const start of tables) {
    largest = Math.max(largest, start.seats);
    if (seen.has(start.id)) continue;
    // Flood the combinable component this table belongs to.
    const stack = [start];
    const local = new Set<string>([start.id]);
    let clusterSeats = 0;
    let size = 0;
    while (stack.length) {
      const cur = stack.pop() as Table;
      clusterSeats += cur.seats;
      size += 1;
      for (const other of tables) {
        if (local.has(other.id)) continue;
        if (linked(cur, other)) {
          local.add(other.id);
          stack.push(other);
        }
      }
    }
    for (const id of local) seen.add(id);
    if (size >= 2) largest = Math.max(largest, clusterSeats);
  }
  return { tableCount: tables.length, totalSeats, largestSeatable: largest };
}

// Unordered combinable pairs among the given tables (cross-zone links ignored).
export function combinablePairs(tables: Table[]): Array<[Table, Table]> {
  const byId = new Map(tables.map((t) => [t.id, t]));
  const out: Array<[Table, Table]> = [];
  const seen = new Set<string>();
  for (const t of tables) {
    for (const otherId of t.combinableWith) {
      const other = byId.get(otherId);
      if (!other) continue;
      const key = [t.id, otherId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([t, other]);
    }
  }
  return out;
}

const toggle = (arr: string[], value: string): string[] =>
  arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

// Add/remove a bidirectional combinable link between two tables. Returns a new array.
export function toggleCombinable(tables: Table[], aId: string, bId: string): Table[] {
  return tables.map((t) => {
    if (t.id === aId) return { ...t, combinableWith: toggle(t.combinableWith, bId) };
    if (t.id === bId) return { ...t, combinableWith: toggle(t.combinableWith, aId) };
    return t;
  });
}

export function newTableId(restaurantId: string): string {
  return `${restaurantId}-t-${Date.now().toString(36)}`;
}
