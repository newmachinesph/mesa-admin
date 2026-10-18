'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import {
  formatDateLong,
  formatTime12,
  minutesOf,
  shiftForTime,
  type Reservation,
  type Restaurant,
  type Schedule,
} from '@/core';
import { EmptyState } from '@/components/ui/primitives';
import { StatusPill, DepositPill, OccasionChip } from '@/components/ui/pill';
import { cn } from '@/lib/utils';
import { SourceIcon, depositStatusFor, tableLabelsFor } from './shared';

interface Group {
  key: string;
  label: string;
  dateISO: string;
  start: number;
  rows: Reservation[];
}

interface Props {
  reservations: Reservation[];
  restaurant: Restaurant;
  schedule: Schedule;
  selectedId: string | null;
  onSelect: (r: Reservation) => void;
  hasFilters: boolean;
}

export function ReservationList({
  reservations,
  restaurant,
  schedule,
  selectedId,
  onSelect,
  hasFilters,
}: Props) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const r of reservations) {
      const shift = shiftForTime(schedule, r.dateISO, r.time);
      const id = shift?.id ?? 'other';
      const key = `${r.dateISO}__${id}`;
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(r);
      } else {
        map.set(key, {
          key,
          label: shift?.name ?? 'Outside service',
          dateISO: r.dateISO,
          start: shift ? minutesOf(shift.start) : 24 * 60,
          rows: [r],
        });
      }
    }
    const arr = [...map.values()];
    arr.sort((a, b) => (a.dateISO === b.dateISO ? a.start - b.start : a.dateISO < b.dateISO ? -1 : 1));
    for (const g of arr) g.rows.sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
    return arr;
  }, [reservations, schedule]);

  const multiDate = useMemo(
    () => new Set(reservations.map((r) => r.dateISO)).size > 1,
    [reservations],
  );

  if (reservations.length === 0) {
    return (
      <div className="p-4">
        {hasFilters ? (
          <EmptyState
            title="No results"
            description="No reservations match these filters. Try a wider range or clear the search."
          />
        ) : (
          <EmptyState
            title="No reservations"
            description="Nothing booked for this range yet. Use “New reservation” to add one."
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {groups.map((g) => (
        <section key={g.key}>
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-paper/95 px-4 py-1.5 backdrop-blur-sm">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
              {g.label}
            </span>
            {multiDate && (
              <span className="text-[12px] text-mute/80">· {formatDateLong(g.dateISO)}</span>
            )}
            <span className="ml-auto text-[12px] tabular-nums text-mute/70">{g.rows.length}</span>
          </div>
          <ul>
            {g.rows.map((r) => (
              <ReservationRow
                key={r.id}
                reservation={r}
                restaurant={restaurant}
                active={r.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface RowProps {
  reservation: Reservation;
  restaurant: Restaurant;
  active: boolean;
  onSelect: (r: Reservation) => void;
}

function ReservationRow({ reservation: r, restaurant, active, onSelect }: RowProps) {
  const tables = tableLabelsFor(restaurant, r.tableIds);
  const depStatus = depositStatusFor(r, restaurant);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(r)}
        aria-current={active}
        className={cn(
          'flex w-full flex-col gap-1.5 border-b border-line px-4 py-3 text-left transition-colors outline-terracotta -outline-offset-2',
          active ? 'bg-sand' : 'hover:bg-paper',
        )}
      >
        <div className="flex items-baseline gap-2.5">
          <span className="w-[4.25rem] shrink-0 text-[15px] font-semibold tabular-nums text-ink">
            {formatTime12(r.time)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{r.name}</span>
          <SourceIcon source={r.source} />
        </div>

        <div className="flex items-center gap-2.5 pl-[4.25rem] text-[13px] text-mute">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Users className="size-3.5" />
            {r.partySize}
          </span>
          <span className="truncate">{tables || 'No table yet'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-[4.25rem]">
          <StatusPill status={r.status} />
          {depStatus !== 'none' && <DepositPill status={depStatus} />}
          {r.occasion && <OccasionChip occasion={r.occasion} />}
        </div>
      </button>
    </li>
  );
}
