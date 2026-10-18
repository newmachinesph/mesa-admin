'use client';

import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { Select as RadixSelect } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { formatTime12, shiftsForDate, slotsForDate, type Schedule } from '@/core';
import { cn } from '@/lib/utils';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Radix Select — used where we need a styled, keyboard-accessible menu (roles,
// occasion, restaurant). For plain enum lists a native <select> is also fine.
export function Select({
  value,
  onValueChange,
  placeholder,
  children,
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-chalk px-3 text-sm text-ink',
          'transition-colors outline-none focus-visible:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/20',
          'data-[placeholder]:text-mute disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="size-4 text-mute" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[--radix-select-trigger-width] overflow-hidden rounded-lg border border-line bg-chalk shadow-[var(--shadow-pop)]"
        >
          <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function Option({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixSelect.Item
      value={value}
      className={cn(
        'relative flex h-9 cursor-pointer select-none items-center rounded-md pl-8 pr-3 text-sm text-ink outline-none',
        'data-[highlighted]:bg-sand data-[state=checked]:font-medium',
      )}
    >
      <RadixSelect.ItemIndicator className="absolute left-2.5">
        <Check className="size-4 text-terracotta" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ref?: Ref<HTMLInputElement>;
}

// Native date input. Defaults min to today (server-driven pages can override).
export function DatePicker({ min, className, ref, ...props }: DatePickerProps) {
  return (
    <input
      ref={ref}
      type="date"
      min={min}
      className={cn(
        'h-10 rounded-lg border border-line bg-chalk px-3 text-sm text-ink',
        'transition-colors outline-none focus-visible:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/20',
        '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}

interface TimeSlotPickerProps {
  schedule: Schedule;
  dateISO: string;
  value?: string;
  onChange: (time: string) => void;
  takenSlots?: string[]; // times to disable (e.g. fully-booked)
}

// Renders every bookable slot for the date, grouped by shift name. Taken slots
// are disabled. Closed days render an empty-hint instead of a grid.
export function TimeSlotPicker({
  schedule,
  dateISO,
  value,
  onChange,
  takenSlots = [],
}: TimeSlotPickerProps) {
  const shifts = shiftsForDate(schedule, dateISO);
  const allSlots = slotsForDate(schedule, dateISO);
  const taken = new Set(takenSlots);

  if (allSlots.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-paper/60 px-3 py-4 text-sm text-mute">
        Closed on this date — no service slots.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {shifts.map((shift) => {
        const start = Number(shift.start.replace(':', ''));
        const end = Number(shift.end.replace(':', ''));
        const slots = allSlots.filter((s) => {
          const n = Number(s.replace(':', ''));
          return n >= start && n < end;
        });
        if (slots.length === 0) return null;
        return (
          <div key={shift.id} className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
              {shift.name}
            </span>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-1.5">
              {slots.map((slot) => {
                const isTaken = taken.has(slot);
                const isSelected = slot === value;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isTaken}
                    onClick={() => onChange(slot)}
                    className={cn(
                      'h-9 rounded-lg border text-[13px] font-medium tabular-nums transition-colors outline-terracotta',
                      isSelected
                        ? 'border-terracotta bg-terracotta text-chalk'
                        : 'border-line bg-chalk text-ink hover:border-terracotta hover:bg-sand',
                      isTaken && 'cursor-not-allowed border-line bg-paper text-mute/50 line-through hover:border-line hover:bg-paper',
                    )}
                  >
                    {formatTime12(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
