import { minutesOf, type DaySchedule, type Schedule, type Shift } from '@/core';

// --- Grid geometry ----------------------------------------------------------
// A clean 10:00 → 24:00 window covers every seeded service (lunch 11:00,
// dinner to 23:00) without wasting vertical space on the small hours.
export const AXIS_START_MIN = 10 * 60;
export const AXIS_END_MIN = 24 * 60;
export const AXIS_SPAN = AXIS_END_MIN - AXIS_START_MIN;

export const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SLOT_OPTIONS = [15, 30, 60] as const;

export function sortShifts(shifts: Shift[]): Shift[] {
  return [...shifts].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
}

// The empty windows between consecutive shifts — the split-shift "closed" bands.
export interface Gap {
  start: string;
  end: string;
}
export function shiftGaps(shifts: Shift[]): Gap[] {
  const sorted = sortShifts(shifts);
  const gaps: Gap[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = minutesOf(sorted[i - 1].end);
    const nextStart = minutesOf(sorted[i].start);
    if (nextStart > prevEnd) gaps.push({ start: sorted[i - 1].end, end: sorted[i].start });
  }
  return gaps;
}

// --- Immutable schedule edits (return new `days` / `closedDates`) ------------
export function setDayShifts(schedule: Schedule, weekday: number, shifts: Shift[]): DaySchedule[] {
  return schedule.days.map((d) =>
    d.weekday === weekday ? { ...d, shifts: sortShifts(shifts) } : d,
  );
}

export function setDayClosed(schedule: Schedule, weekday: number, closed: boolean): DaySchedule[] {
  // Keep the day's shifts on close so reopening restores them.
  return schedule.days.map((d) => (d.weekday === weekday ? { ...d, closed } : d));
}

export function addClosedDate(schedule: Schedule, dateISO: string): string[] {
  if (schedule.closedDates.includes(dateISO)) return schedule.closedDates;
  return [...schedule.closedDates, dateISO].sort();
}

export function removeClosedDate(schedule: Schedule, dateISO: string): string[] {
  return schedule.closedDates.filter((d) => d !== dateISO);
}

// A mall branch runs one continuous shift that spans lunch through dinner
// (e.g. Salcedo 11:00–21:00). A dinner-only single shift (Casa 17:00) is not
// a mall envelope, so require the shift to open by noon and close by 20:00+.
export function isMallHours(schedule: Schedule): boolean {
  const open = schedule.days.filter((d) => !d.closed && d.shifts.length > 0);
  if (open.length === 0) return false;
  return open.every(
    (d) =>
      d.shifts.length === 1 &&
      minutesOf(d.shifts[0].start) <= 12 * 60 &&
      minutesOf(d.shifts[0].end) >= 20 * 60,
  );
}

// --- Shift validation --------------------------------------------------------
// end > start and no overlap are hard errors; a sub-hour service only warns.
export interface ShiftValidation {
  error?: string;
  warning?: string;
}
export function validateShift(
  name: string,
  start: string,
  end: string,
  others: Shift[],
): ShiftValidation {
  if (!name.trim()) return { error: 'Give the shift a name.' };
  if (!start || !end) return { error: 'Set both a start and end time.' };
  const s = minutesOf(start);
  const e = minutesOf(end);
  if (e <= s) return { error: 'End time must be after the start time.' };
  const overlaps = others.some((o) => s < minutesOf(o.end) && e > minutesOf(o.start));
  if (overlaps) return { error: 'This overlaps another shift on the same day.' };
  if (e - s < 60) return { warning: 'Under an hour — unusually short for a service.' };
  return {};
}

// ponytail: clock + small random is enough uniqueness for a single-client demo;
// a real backend assigns shift ids. Only needs to be unique within one day.
export function newShiftId(): string {
  return `sh-${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;
}
