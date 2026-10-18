'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { Guest } from '@/core';
import { useMesaStore } from '@/lib/store';
import { TextArea } from '@/components/ui/field';
import { cn } from '@/lib/utils';

// Free-text notes that autosave on blur. Parent remounts this per guest (key=id),
// so local state seeds cleanly from guest.notes without an effect.
export function GuestNotes({ guest, canEdit }: { guest: Guest; canEdit: boolean }) {
  const setGuestNotes = useMesaStore((s) => s.setGuestNotes);
  const [value, setValue] = useState(guest.notes);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = () => {
    if (value === guest.notes) return;
    setGuestNotes(guest.id, value);
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  };

  if (!canEdit) {
    return value ? (
      <p className="whitespace-pre-wrap text-sm text-slate">{value}</p>
    ) : (
      <p className="text-sm text-mute">No notes.</p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder="Preferences, allergies, seating requests…"
        aria-label="Guest notes"
      />
      <span
        className={cn(
          'inline-flex items-center gap-1 self-end text-xs text-ok transition-opacity',
          saved ? 'opacity-100' : 'opacity-0',
        )}
        aria-live="polite"
      >
        <Check className="size-3.5" />
        Saved
      </span>
    </div>
  );
}
