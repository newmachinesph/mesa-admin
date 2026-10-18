'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { can, formatDateLong, formatTime12, type Schedule, type Shift } from '@/core';
import { useActiveRestaurant, useActiveSchedule, useMesaStore, useRole } from '@/lib/store';
import { Card, EmptyState, PageHeader, Section } from '@/components/ui/primitives';
import { WeekGrid } from './_components/WeekGrid';
import { ShiftEditor, type ShiftEditorState } from './_components/ShiftEditor';
import { SlotPreview } from './_components/SlotPreview';
import { ClosedDates } from './_components/ClosedDates';
import {
  WEEKDAY_NAMES,
  addClosedDate,
  isMallHours,
  removeClosedDate,
  setDayClosed,
  setDayShifts,
} from './_components/schedule-ops';

// Every schedule edit affects what the booking flow can offer — say so.
const AVAIL_HINT = 'Reservations availability now respects the change.';

export default function SchedulePage() {
  const role = useRole();
  const restaurant = useActiveRestaurant();
  const schedule = useActiveSchedule();
  const updateSchedule = useMesaStore((s) => s.updateSchedule);
  const canEdit = can(role, 'schedule:edit');

  const [editor, setEditor] = useState<ShiftEditorState | null>(null);
  // The Schedule type has no per-date note field, so notes live in local UI
  // state. Seed the one seeded holiday (Salcedo, 2026-12-25) so it surfaces.
  // ponytail: local-only; a real backend would store notes alongside the date.
  const [dateNotes, setDateNotes] = useState<Record<string, string>>({
    '2026-12-25': 'Christmas Day',
  });

  if (!schedule || !restaurant) {
    return (
      <div className="p-6">
        <EmptyState
          title="No schedule to edit"
          description="Pick a restaurant to manage its trading hours."
        />
      </div>
    );
  }

  const commit = (patch: Partial<Schedule>, message: string) => {
    updateSchedule(schedule.id, patch);
    toast.success(message, { description: AVAIL_HINT });
  };

  const handleSaveShift = (weekday: number, shift: Shift) => {
    const existing = schedule.days.find((d) => d.weekday === weekday)?.shifts ?? [];
    const isNew = !existing.some((s) => s.id === shift.id);
    const shifts = isNew
      ? [...existing, shift]
      : existing.map((s) => (s.id === shift.id ? shift : s));
    commit(
      { days: setDayShifts(schedule, weekday, shifts) },
      `${shift.name} ${isNew ? 'added' : 'updated'} · ${WEEKDAY_NAMES[weekday]}`,
    );
  };

  const handleDeleteShift = (weekday: number, shiftId: string) => {
    const existing = schedule.days.find((d) => d.weekday === weekday)?.shifts ?? [];
    commit(
      { days: setDayShifts(schedule, weekday, existing.filter((s) => s.id !== shiftId)) },
      `Shift removed · ${WEEKDAY_NAMES[weekday]}`,
    );
  };

  const handleToggleClosed = (weekday: number, closed: boolean) => {
    commit(
      { days: setDayClosed(schedule, weekday, closed) },
      `${WEEKDAY_NAMES[weekday]} ${closed ? 'marked closed' : 'reopened'}`,
    );
  };

  const handleSlotMinutes = (minutes: number) => {
    commit({ slotMinutes: minutes }, `Booking slots set to ${minutes}-minute spacing`);
  };

  const handleAddClosedDate = (dateISO: string, note: string) => {
    if (schedule.closedDates.includes(dateISO)) {
      toast.error('That date is already closed.');
      return;
    }
    setDateNotes((prev) => ({ ...prev, [dateISO]: note }));
    commit(
      { closedDates: addClosedDate(schedule, dateISO) },
      `Closed ${formatDateLong(dateISO)}`,
    );
  };

  const handleRemoveClosedDate = (dateISO: string) => {
    commit(
      { closedDates: removeClosedDate(schedule, dateISO) },
      `Reopened ${formatDateLong(dateISO)}`,
    );
  };

  const mall = isMallHours(schedule);
  const mallShift = mall
    ? schedule.days.find((d) => !d.closed && d.shifts.length > 0)?.shifts[0]
    : undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        eyebrow={restaurant.name}
        title="Schedule"
        subtitle="Weekly trading hours, booking slots, and holiday closures."
      />

      {!canEdit && (
        <div className="rounded-card border border-info/25 bg-info-bg/60 px-4 py-3 text-sm text-info">
          Read-only access — only managers can edit trading hours.
        </div>
      )}

      {mall && mallShift && (
        <div className="rounded-card border border-line bg-warn-bg/70 px-4 py-3 text-sm text-slate">
          <span className="font-semibold text-warn">Mall hours.</span> {restaurant.name} trades
          inside its mall envelope ({formatTime12(mallShift.start)} – {formatTime12(mallShift.end)},
          continuous). Bookings are capped by mall opening — slots can’t extend past close.
        </div>
      )}

      <Section
        title="Weekly hours"
        description="Split shifts are normal here — the afternoon gap shows as a closed band."
      >
        <Card className="p-3">
          <WeekGrid
            schedule={schedule}
            canEdit={canEdit}
            onAddShift={(w) => setEditor({ weekday: w, shift: null })}
            onEditShift={(w, s) => setEditor({ weekday: w, shift: s })}
            onToggleClosed={handleToggleClosed}
          />
        </Card>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Booking slots" description="Interval control with a live guest preview.">
          <Card className="p-4">
            <SlotPreview schedule={schedule} canEdit={canEdit} onSlotMinutes={handleSlotMinutes} />
          </Card>
        </Section>

        <Section title="Closed dates" description="Holidays and one-off closures.">
          <Card className="p-4">
            <ClosedDates
              schedule={schedule}
              canEdit={canEdit}
              notes={dateNotes}
              onAdd={handleAddClosedDate}
              onRemove={handleRemoveClosedDate}
            />
          </Card>
        </Section>
      </div>

      {editor && (
        <ShiftEditor
          key={`${editor.weekday}-${editor.shift?.id ?? 'new'}`}
          state={editor}
          schedule={schedule}
          restaurantName={restaurant.name}
          onClose={() => setEditor(null)}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      )}
    </div>
  );
}
