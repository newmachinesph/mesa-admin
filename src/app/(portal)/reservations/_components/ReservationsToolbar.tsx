'use client';

import { X } from 'lucide-react';
import { statusLabel, type ReservationStatus, type Shift } from '@/core';
import { DatePicker, Select, Option } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { FilterView } from './shared';

const VIEWS: { id: FilterView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All' },
];

const STATUSES: ReservationStatus[] = [
  'pending',
  'confirmed',
  'seated',
  'completed',
  'no_show',
  'cancelled',
];

interface Props {
  view: FilterView;
  onView: (v: FilterView) => void;
  date: string;
  onDate: (d: string) => void;
  shiftId: string;
  onShift: (id: string) => void;
  status: string;
  onStatus: (s: string) => void;
  query: string;
  onQuery: (q: string) => void;
  shifts: Shift[];
  todayISO: string;
}

export function ReservationsToolbar({
  view,
  onView,
  date,
  onDate,
  shiftId,
  onShift,
  status,
  onStatus,
  query,
  onQuery,
  shifts,
  todayISO,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <SearchInput
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search name or mobile…"
        aria-label="Search reservations"
      />

      {/* View range — picking a specific date clears the segmented selection. */}
      <div className="inline-flex items-center rounded-lg border border-line bg-sand p-0.5">
        {VIEWS.map((v) => {
          const active = !date && view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onView(v.id)}
              aria-pressed={active}
              className={cn(
                'h-7 rounded-md px-3 text-[13px] font-medium transition-colors outline-terracotta',
                active ? 'bg-chalk text-ink shadow-[var(--shadow-soft)]' : 'text-mute hover:text-ink',
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* One row, always. The three filters share the pane width rather than
          wrapping — flex-1 + min-w-0 lets the native date input shrink. */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <DatePicker
            value={date}
            onChange={(e) => onDate(e.target.value)}
            aria-label="Filter by date"
            className={cn('w-full', date && 'border-terracotta pr-9')}
          />
          {date && (
            <button
              type="button"
              onClick={() => onDate('')}
              aria-label="Clear date filter"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-mute hover:bg-sand hover:text-ink outline-terracotta"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {shifts.length > 0 && (
          <Select
            value={shiftId || 'all'}
            onValueChange={(v) => onShift(v === 'all' ? '' : v)}
            aria-label="Filter by shift"
            className="w-full min-w-0 flex-1"
          >
            <Option value="all">All shifts</Option>
            {shifts.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>
        )}

        <Select
          value={status || 'all'}
          onValueChange={(v) => onStatus(v === 'all' ? '' : v)}
          aria-label="Filter by status"
          className="w-full min-w-0 flex-1"
        >
          <Option value="all">All statuses</Option>
          {STATUSES.map((s) => (
            <Option key={s} value={s}>
              {statusLabel(s)}
            </Option>
          ))}
        </Select>
      </div>

      {date && (
        <p className="text-xs text-mute">
          Showing {date === todayISO ? 'today' : date} — pick a range above to clear.
        </p>
      )}
    </div>
  );
}
