'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Table, TableShape } from '@/core';
import { cn } from '@/lib/utils';

interface TableTokenProps {
  table: Table;
  occupiedGuest?: string;
  selected?: boolean;
  editable?: boolean;
  dragging?: boolean;
  onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

/** A chair, drawn pointing "up" (its back at the top), centred on the origin. */
function Chair({ x, y, rot }: Seat) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {/* backrest */}
      <rect x={-6} y={-7} width={12} height={3.4} rx={1.7} className="fill-slate/35" />
      {/* seat pad */}
      <rect
        x={-5.4}
        y={-3.6}
        width={10.8}
        height={8.4}
        rx={2.2}
        className="fill-sand stroke-slate/25"
        strokeWidth={0.8}
      />
    </g>
  );
}

interface Seat {
  x: number;
  y: number;
  rot: number;
}

/** Evenly space `n` seats along a segment, each facing `rot` degrees. */
function alongX(n: number, y: number, x0: number, x1: number, rot: number): Seat[] {
  return Array.from({ length: n }, (_, i) => ({
    x: x0 + ((i + 1) * (x1 - x0)) / (n + 1),
    y,
    rot,
  }));
}

function alongY(n: number, x: number, y0: number, y1: number, rot: number): Seat[] {
  return Array.from({ length: n }, (_, i) => ({
    x,
    y: y0 + ((i + 1) * (y1 - y0)) / (n + 1),
    rot,
  }));
}

// Seat placement per shape. Chairs sit just outside the table edge and face inward.
function seatsFor(shape: TableShape, seats: number): Seat[] {
  if (seats <= 0) return [];

  if (shape === 'round') {
    // Start at the top and walk clockwise.
    return Array.from({ length: seats }, (_, i) => {
      const deg = (360 / seats) * i;
      const rad = ((deg - 90) * Math.PI) / 180;
      return { x: 50 + 39 * Math.cos(rad), y: 50 + 39 * Math.sin(rad), rot: deg };
    });
  }

  if (shape === 'square') {
    // Round-robin across the four sides so a 4-top puts one chair per side.
    const sides: Seat[][] = [[], [], [], []];
    const count = [0, 0, 0, 0];
    for (let i = 0; i < seats; i++) count[i % 4]++;
    sides[0] = alongX(count[0], 15, 27, 73, 180); // top, facing down
    sides[1] = alongY(count[1], 85, 27, 73, 270); // right, facing left
    sides[2] = alongX(count[2], 85, 27, 73, 0); // bottom, facing up
    sides[3] = alongY(count[3], 15, 27, 73, 90); // left, facing right
    return sides.flat();
  }

  if (shape === 'rect') {
    // Long sides carry the party; the ends only get a chair once it's a big table.
    const ends = seats >= 6 ? 1 : 0;
    const remaining = seats - ends * 2;
    const top = Math.ceil(remaining / 2);
    const bottom = remaining - top;
    return [
      ...alongX(top, 21, 14, 86, 180),
      ...alongX(bottom, 79, 14, 86, 0),
      ...alongY(ends, 6, 32, 68, 90),
      ...alongY(ends, 94, 32, 68, 270),
    ];
  }

  return []; // booth draws benches instead of chairs
}

const TABLE_STROKE = 1.2;

function TableTop({ shape, occupied }: { shape: TableShape; occupied: boolean }) {
  const skin = cn(
    'fill-chalk transition-colors',
    occupied ? 'stroke-terracotta' : 'stroke-slate/30',
  );

  if (shape === 'round') {
    return <circle cx={50} cy={50} r={27} className={skin} strokeWidth={TABLE_STROKE} />;
  }
  if (shape === 'square') {
    return (
      <rect x={27} y={27} width={46} height={46} rx={5} className={skin} strokeWidth={TABLE_STROKE} />
    );
  }
  if (shape === 'rect') {
    return (
      <rect x={14} y={32} width={72} height={36} rx={4} className={skin} strokeWidth={TABLE_STROKE} />
    );
  }
  // Booth: a table between two upholstered benches.
  return (
    <>
      <rect x={22} y={26} width={56} height={10} rx={4} className="fill-sand stroke-slate/25" strokeWidth={0.9} />
      <rect x={26} y={40} width={48} height={20} rx={3} className={skin} strokeWidth={TABLE_STROKE} />
      <rect x={22} y={64} width={56} height={10} rx={4} className="fill-sand stroke-slate/25" strokeWidth={0.9} />
    </>
  );
}

// Fills its container (a grid cell, or the floating drag layer). Occupied-now
// tables get a terracotta table top + the guest name as a native tooltip.
export function TableToken({
  table,
  occupiedGuest,
  selected,
  editable,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: TableTokenProps) {
  const title = occupiedGuest
    ? `${table.label} · seated: ${occupiedGuest}`
    : `${table.label} · seats ${table.minSeats}–${table.seats}`;

  const seats = seatsFor(table.shape, table.seats);

  return (
    <button
      type="button"
      title={title}
      tabIndex={editable ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        'group flex h-full w-full touch-none select-none flex-col items-center justify-center gap-0.5 px-0.5',
        editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        dragging && 'cursor-grabbing',
      )}
    >
      <span className="max-w-full truncate text-[10px] font-medium leading-none text-mute">
        {table.label}
      </span>
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'h-full w-full overflow-visible',
          occupiedGuest && 'drop-shadow-[0_0_0_1px_var(--color-terracotta)]',
          dragging && 'drop-shadow-[var(--shadow-pop)]',
        )}
        aria-hidden="true"
      >
        {selected && !occupiedGuest && (
          <rect
            x={2}
            y={2}
            width={96}
            height={96}
            rx={8}
            className="fill-terracotta/8 stroke-terracotta/40"
            strokeWidth={1}
          />
        )}
        <g className={cn(editable && !occupiedGuest && 'group-hover:opacity-90')}>
          {seats.map((s, i) => (
            <Chair key={i} {...s} />
          ))}
          <TableTop shape={table.shape} occupied={Boolean(occupiedGuest)} />
          <text
            x={50}
            y={table.shape === 'booth' ? 51 : 50}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ink text-[13px] font-semibold tabular-nums"
            style={{ fontSize: table.shape === 'booth' ? 11 : 14 }}
          >
            {table.seats}
          </text>
        </g>
      </svg>
    </button>
  );
}
