'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Schedule, Shift } from '@/core';
import { Modal } from '@/components/ui/dialog';
import { Field, TextInput } from '@/components/ui/field';
import { GhostButton, PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { WEEKDAY_NAMES, newShiftId, validateShift } from './schedule-ops';

export interface ShiftEditorState {
  weekday: number;
  shift: Shift | null; // null => adding a new shift
}

interface ShiftEditorProps {
  // Parent renders this only when open, keyed by target — so state is never
  // null here and useState initializers reseed the draft on each open.
  state: ShiftEditorState;
  schedule: Schedule;
  restaurantName: string;
  onClose: () => void;
  onSave: (weekday: number, shift: Shift) => void;
  onDelete: (weekday: number, shiftId: string) => void;
}

export function ShiftEditor({
  state,
  schedule,
  restaurantName,
  onClose,
  onSave,
  onDelete,
}: ShiftEditorProps) {
  const editing = state.shift;
  const [name, setName] = useState(editing?.name ?? '');
  const [start, setStart] = useState(editing?.start ?? '17:00');
  const [end, setEnd] = useState(editing?.end ?? '22:00');

  const day = schedule.days.find((d) => d.weekday === state.weekday);
  const others = (day?.shifts ?? []).filter((s) => s.id !== editing?.id);
  const { error, warning } = validateShift(name, start, end, others);

  const handleSave = () => {
    if (error) return;
    onSave(state.weekday, {
      id: editing?.id ?? newShiftId(),
      name: name.trim(),
      start,
      end,
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={editing ? 'Edit shift' : 'Add shift'}
      description={`${WEEKDAY_NAMES[state.weekday]} · ${restaurantName}`}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {editing && (
              <GhostButton
                size="sm"
                className="gap-1.5 text-danger hover:bg-danger-bg hover:text-danger"
                onClick={() => {
                  onDelete(state.weekday, editing.id);
                  onClose();
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </GhostButton>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton size="sm" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" disabled={Boolean(error)} onClick={handleSave}>
              {editing ? 'Save shift' : 'Add shift'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Shift name" required htmlFor="shift-name">
          <TextInput
            id="shift-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lunch"
            invalid={Boolean(error) && !name.trim()}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens" required htmlFor="shift-start">
            <TextInput
              id="shift-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="Closes" required htmlFor="shift-end">
            <TextInput
              id="shift-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : (
          warning && <p className="text-xs text-warn">{warning}</p>
        )}
      </div>
    </Modal>
  );
}
