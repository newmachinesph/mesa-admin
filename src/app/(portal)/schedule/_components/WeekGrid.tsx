'use client';

import { Plus } from 'lucide-react';
import { formatTime12, minutesOf, type DaySchedule, type Schedule, type Shift } from '@/core';
import { cn } from '@/lib/utils';
import { GhostButton, IconButton } from '@/components/ui/button';
import {
  AXIS_END_MIN,
  AXIS_SPAN,
  AXIS_START_MIN,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  shiftGaps,
  sortShifts,
} from './schedule-ops';

const HOUR_MARKS: number[] = [];
for (let m = AXIS_START_MIN; m <= AXIS_END_MIN; m += 120) HOUR_MARKS.push(m);

// Compact 12h axis tick: 10a, 12p, 2p … 12a.
function axisLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

const pct = (min: number): number => ((min - AXIS_START_MIN) / AXIS_SPAN) * 100;

interface WeekGridProps {
  schedule: Schedule;
  canEdit: boolean;
  onAddShift: (weekday: number) => void;
  onEditShift: (weekday: number, shift: Shift) => void;
  onToggleClosed: (weekday: number, closed: boolean) => void;
}

const COLS = 'grid grid-cols-[3rem_repeat(7,minmax(6.5rem,1fr))]';

export function WeekGrid({
  schedule,
  canEdit,
  onAddShift,
  onEditShift,
  onToggleClosed,
}: WeekGridProps) {
  const days = [...schedule.days].sort((a, b) => a.weekday - b.weekday);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[52rem]">
        {/* Day headers + per-day controls */}
        <div className={cn(COLS, 'border-b border-line')}>
          <div />
          {days.map((day) => (
            <div key={day.weekday} className="border-l border-line px-2 py-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-semibold text-ink">
                  {WEEKDAY_SHORT[day.weekday]}
                </span>
                {canEdit && !day.closed && (
                  <IconButton
                    size="sm"
                    label={`Add shift on ${WEEKDAY_NAMES[day.weekday]}`}
                    onClick={() => onAddShift(day.weekday)}
                  >
                    <Plus className="size-4" />
                  </IconButton>
                )}
              </div>
              {canEdit ? (
                <GhostButton
                  size="sm"
                  className="mt-1 h-6 px-1.5 text-[11px]"
                  onClick={() => onToggleClosed(day.weekday, !day.closed)}
                >
                  {day.closed ? 'Reopen' : 'Mark closed'}
                </GhostButton>
              ) : (
                day.closed && <span className="mt-1 block text-[11px] text-mute">Closed</span>
              )}
            </div>
          ))}
        </div>

        {/* Time axis + day columns */}
        <div className={COLS}>
          <div className="relative h-[30rem]">
            {HOUR_MARKS.map((m) => (
              <span
                key={m}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-mute"
                style={{ top: `${pct(m)}%` }}
              >
                {axisLabel(m)}
              </span>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn
              key={day.weekday}
              day={day}
              canEdit={canEdit}
              onEditShift={onEditShift}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  canEdit,
  onEditShift,
}: {
  day: DaySchedule;
  canEdit: boolean;
  onEditShift: (weekday: number, shift: Shift) => void;
}) {
  return (
    <div className="relative h-[30rem] border-l border-line">
      {HOUR_MARKS.map((m) => (
        <div
          key={m}
          className="pointer-events-none absolute inset-x-0 border-t border-line/50"
          style={{ top: `${pct(m)}%` }}
        />
      ))}

      {day.closed ? (
        <div className="absolute inset-1 flex items-center justify-center rounded-md bg-sand">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-mute">
            Closed
          </span>
        </div>
      ) : day.shifts.length === 0 ? (
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 text-center text-[11px] text-mute">
          No service set
        </div>
      ) : (
        <>
          {shiftGaps(day.shifts).map((g) => (
            <ClosedBand key={`${g.start}-${g.end}`} start={g.start} end={g.end} />
          ))}
          {sortShifts(day.shifts).map((shift) => (
            <ShiftBlock
              key={shift.id}
              shift={shift}
              canEdit={canEdit}
              onClick={() => onEditShift(day.weekday, shift)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// Hatched band drawn for the gap between split shifts (e.g. 14:30 – 17:30).
function ClosedBand({ start, end }: { start: string; end: string }) {
  const top = pct(minutesOf(start));
  const height = pct(minutesOf(end)) - top;
  return (
    <div
      className="absolute inset-x-1 flex items-center justify-center overflow-hidden rounded-[6px] border border-dashed border-line"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 5px, var(--color-sand) 5px, var(--color-sand) 6px)',
      }}
    >
      <span className="px-1 text-center text-[10px] leading-tight text-mute">
        Closed
        <br />
        {formatTime12(start)} – {formatTime12(end)}
      </span>
    </div>
  );
}

// Open-service block. Olive keeps terracotta free for the primary action and
// brass free for celebrations.
function ShiftBlock({
  shift,
  canEdit,
  onClick,
}: {
  shift: Shift;
  canEdit: boolean;
  onClick: () => void;
}) {
  const top = pct(minutesOf(shift.start));
  const height = pct(minutesOf(shift.end)) - top;
  const cls = 'absolute inset-x-1 overflow-hidden rounded-md border border-olive/30 bg-olive/10 px-1.5 py-1 text-left';
  const style = { top: `${top}%`, height: `${height}%` };
  const body = (
    <>
      <span className="block truncate text-[11px] font-semibold text-ink">{shift.name}</span>
      <span className="block truncate text-[10px] tabular-nums text-slate">
        {formatTime12(shift.start)} – {formatTime12(shift.end)}
      </span>
    </>
  );

  if (!canEdit) {
    return (
      <div className={cls} style={style}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(cls, 'outline-terracotta transition-colors hover:border-olive/60 hover:bg-olive/20')}
      style={style}
    >
      {body}
    </button>
  );
}
