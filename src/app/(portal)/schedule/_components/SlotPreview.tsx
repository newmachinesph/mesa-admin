'use client';

import { useState } from 'react';
import { formatDateLong, slotsForDate, todayISO, type Schedule } from '@/core';
import { cn } from '@/lib/utils';
import { DatePicker, TimeSlotPicker } from '@/components/ui/select';
import { SLOT_OPTIONS } from './schedule-ops';

interface SlotPreviewProps {
  schedule: Schedule;
  canEdit: boolean;
  onSlotMinutes: (minutes: number) => void;
}

export function SlotPreview({ schedule, canEdit, onSlotMinutes }: SlotPreviewProps) {
  const [date, setDate] = useState(todayISO());
  const [selected, setSelected] = useState<string>();
  const slots = slotsForDate(schedule, date);

  return (
    <div className="flex flex-col gap-5">
      {/* Slot interval control */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Slot interval</span>
        <div className="inline-flex w-fit rounded-lg border border-line bg-chalk p-0.5">
          {SLOT_OPTIONS.map((opt) => {
            const active = schedule.slotMinutes === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={!canEdit}
                onClick={() => onSlotMinutes(opt)}
                aria-pressed={active}
                className={cn(
                  'h-8 rounded-md px-3 text-[13px] font-medium tabular-nums outline-terracotta transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'bg-terracotta text-chalk' : 'text-slate hover:bg-sand',
                )}
              >
                {opt} min
              </button>
            );
          })}
        </div>
        <p className="text-xs text-mute">
          {canEdit
            ? 'How far apart bookable start times are generated.'
            : 'Read-only — only managers change the interval.'}
        </p>
      </div>

      {/* Live guest-facing preview */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink">What guests will see</span>
          <DatePicker
            aria-label="Preview date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <p className="text-xs text-mute">
          {formatDateLong(date)} · {slots.length} bookable {slots.length === 1 ? 'slot' : 'slots'}
          {slots.length > 0 && ` at ${schedule.slotMinutes}-min spacing`}
        </p>
        <div className="rounded-card border border-line bg-paper/60 p-3">
          <TimeSlotPicker
            schedule={schedule}
            dateISO={date}
            value={selected}
            onChange={setSelected}
          />
        </div>
      </div>
    </div>
  );
}
