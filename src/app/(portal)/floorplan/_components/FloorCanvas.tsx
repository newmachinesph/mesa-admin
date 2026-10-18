'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Table } from '@/core';
import { cn } from '@/lib/utils';
import { TableToken } from './TableToken';
import { cellFromPointer, GRID_COLS, GRID_ROWS } from './floorplan-utils';

interface DragState {
  tableId: string;
  startX: number;
  startY: number;
  pointerX: number;
  pointerY: number;
  targetX: number;
  targetY: number;
  valid: boolean;
  moved: boolean;
  cellW: number;
  cellH: number;
}

const MOVE_THRESHOLD = 4; // px before a press counts as a drag rather than a tap

interface FloorCanvasProps {
  zoneTables: Table[];
  occupied: Map<string, string>;
  editable: boolean;
  selectedId?: string;
  onEdit: (table: Table) => void;
  onMove: (id: string, x: number, y: number) => void;
  onPlace: (x: number, y: number) => void;
}

// 12x8 snap-to-grid board. Tap an empty cell to place, tap a table to edit,
// drag a table to reposition (snaps to the nearest free cell, reverts on occupied).
export function FloorCanvas({
  zoneTables,
  occupied,
  editable,
  selectedId,
  onEdit,
  onMove,
  onPlace,
}: FloorCanvasProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const cellMap = new Map<string, Table>();
  for (const t of zoneTables) cellMap.set(`${t.gridX},${t.gridY}`, t);

  const update = (next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const handleDown = (table: Table) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editable) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    update({
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      pointerX: e.clientX,
      pointerY: e.clientY,
      targetX: table.gridX,
      targetY: table.gridY,
      valid: true,
      moved: false,
      cellW: rect.width / GRID_COLS,
      cellH: rect.height / GRID_ROWS,
    });
  };

  const handleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = cellFromPointer(rect, e.clientX, e.clientY);
    const occ = cellMap.get(`${x},${y}`);
    update({
      ...d,
      pointerX: e.clientX,
      pointerY: e.clientY,
      targetX: x,
      targetY: y,
      valid: !occ || occ.id === d.tableId,
      moved:
        d.moved ||
        Math.abs(e.clientX - d.startX) > MOVE_THRESHOLD ||
        Math.abs(e.clientY - d.startY) > MOVE_THRESHOLD,
    });
  };

  const handleUp = (table: Table) => () => {
    const d = dragRef.current;
    update(null);
    if (!d || d.tableId !== table.id) return;
    if (!d.moved) {
      onEdit(table); // a press that never moved is a tap
      return;
    }
    // Drop: commit only to a free cell that actually changed.
    if (d.valid && (d.targetX !== table.gridX || d.targetY !== table.gridY)) {
      onMove(table.id, d.targetX, d.targetY);
    }
  };

  const cells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const table = cellMap.get(`${x},${y}`);
      const key = `${x},${y}`;
      if (table) {
        const isDragged = drag?.tableId === table.id;
        cells.push(
          <div key={key} className={cn('min-h-0 min-w-0', isDragged && 'opacity-30')}>
            <TableToken
              table={table}
              occupiedGuest={occupied.get(table.id)}
              selected={selectedId === table.id}
              editable={editable}
              onPointerDown={handleDown(table)}
              onPointerMove={handleMove}
              onPointerUp={handleUp(table)}
            />
          </div>,
        );
      } else if (editable) {
        cells.push(
          <button
            key={key}
            type="button"
            aria-label={`Place a table at column ${x + 1}, row ${y + 1}`}
            onClick={() => onPlace(x, y)}
            className="grid min-h-0 min-w-0 place-items-center rounded-md border border-dashed border-line/70 bg-chalk/30 text-mute/0 transition-colors hover:border-terracotta hover:bg-sand/50 hover:text-terracotta"
          >
            <Plus className="size-4" />
          </button>,
        );
      } else {
        cells.push(<div key={key} className="rounded-md border border-dashed border-line/40" />);
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="w-full min-w-[600px] max-w-[880px] rounded-card border border-line bg-paper p-2">
        <div ref={boardRef} className="relative grid aspect-[12/8] grid-cols-12 grid-rows-8 gap-1">
          {cells}

          {/* Snap-target highlight on a matching overlay grid — stays cell-aligned. */}
          {drag?.moved && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-8 gap-1"
            >
              <div
                className={cn(
                  'rounded-md border-2 border-dashed',
                  drag.valid ? 'border-terracotta bg-terracotta/10' : 'border-danger bg-danger/10',
                )}
                style={{ gridColumnStart: drag.targetX + 1, gridRowStart: drag.targetY + 1 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating token follows the pointer during a drag. */}
      {drag?.moved && (() => {
        const table = zoneTables.find((t) => t.id === drag.tableId);
        if (!table) return null;
        return (
          <div
            aria-hidden
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
            style={{ left: drag.pointerX, top: drag.pointerY, width: drag.cellW, height: drag.cellH }}
          >
            <TableToken table={table} occupiedGuest={occupied.get(table.id)} dragging />
          </div>
        );
      })()}
    </div>
  );
}
