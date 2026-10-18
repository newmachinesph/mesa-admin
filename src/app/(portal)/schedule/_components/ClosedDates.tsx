'use client';

import { useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { formatDateLong, todayISO, type Schedule } from '@/core';
import { EmptyState } from '@/components/ui/primitives';
import { PrimaryButton, IconButton } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/select';

interface ClosedDatesProps {
  schedule: Schedule;
  canEdit: boolean;
  notes: Record<string, string>;
  onAdd: (dateISO: string, note: string) => void;
  onRemove: (dateISO: string) => void;
}

export function ClosedDates({ schedule, canEdit, notes, onAdd, onRemove }: ClosedDatesProps) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const today = todayISO();

  const sorted = [...schedule.closedDates].sort();
  const upcoming = sorted.filter((d) => d >= today);
  const past = sorted.filter((d) => d < today);

  const submit = () => {
    if (!date) return;
    onAdd(date, note.trim());
    setDate('');
    setNote('');
  };

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper/50 p-3">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <Field label="Date" htmlFor="closed-date">
              <DatePicker
                id="closed-date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Note" hint="e.g. holiday or private event" htmlFor="closed-note">
              <TextInput
                id="closed-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Christmas Day"
              />
            </Field>
          </div>
          <PrimaryButton size="sm" className="w-fit" disabled={!date} onClick={submit}>
            <CalendarPlus className="size-4" />
            Add closed date
          </PrimaryButton>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          title="No closed dates"
          description={
            canEdit
              ? 'Add holidays or one-off closures above — guests can’t book them.'
              : 'No holidays or one-off closures are set.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {upcoming.length > 0 && (
            <DateList
              label="Upcoming"
              dates={upcoming}
              notes={notes}
              canEdit={canEdit}
              onRemove={onRemove}
            />
          )}
          {past.length > 0 && (
            <DateList
              label="Past"
              dates={past}
              notes={notes}
              canEdit={canEdit}
              onRemove={onRemove}
              muted
            />
          )}
        </div>
      )}
    </div>
  );
}

function DateList({
  label,
  dates,
  notes,
  canEdit,
  onRemove,
  muted,
}: {
  label: string;
  dates: string[];
  notes: Record<string, string>;
  canEdit: boolean;
  onRemove: (dateISO: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
        {label}
      </span>
      <ul className="divide-y divide-line">
        {dates.map((d) => (
          <li key={d} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className={muted ? 'text-sm text-mute' : 'text-sm font-medium text-ink'}>
                {formatDateLong(d)}
              </p>
              {notes[d] && <p className="truncate text-xs text-mute">{notes[d]}</p>}
            </div>
            {canEdit && (
              <IconButton size="sm" label={`Remove ${formatDateLong(d)}`} onClick={() => onRemove(d)}>
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
