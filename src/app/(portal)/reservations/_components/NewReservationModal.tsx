'use client';

import { useMemo, useState } from 'react';
import {
  checkAvailability,
  depositAmount,
  depositRequired,
  formatPeso,
  formatTime12,
  isValidPhMobile,
  slotsForDate,
  todayISO,
  type Occasion,
  type Reservation,
  type Restaurant,
  type Role,
  type Schedule,
} from '@/core';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { Field, NumberStepper, PhoneField, TextArea, TextInput } from '@/components/ui/field';
import { DatePicker, Select, Option, TimeSlotPicker } from '@/components/ui/select';
import { AvailabilityBadge } from '@/components/ui/pill';
import type { NewReservationInput } from '@/lib/store';

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'debut', label: 'Debut (18th)' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'christening', label: 'Christening' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'despedida', label: 'Despedida' },
  { value: 'blowout', label: 'Blowout' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  schedule: Schedule;
  allReservations: Reservation[];
  role: Role;
  onCreate: (input: NewReservationInput, depositOwed: number) => void;
}

export function NewReservationModal({
  open,
  onOpenChange,
  restaurant,
  schedule,
  allReservations,
  role,
  onCreate,
}: Props) {
  const today = todayISO();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [dateISO, setDateISO] = useState(today);
  const [time, setTime] = useState('');
  const [occasion, setOccasion] = useState<Occasion | ''>('');
  const [notes, setNotes] = useState('');
  const [overbookOpen, setOverbookOpen] = useState(false);

  const policy = restaurant.depositPolicy;
  const depReq = depositRequired(policy, partySize);
  const depAmount = depositAmount(policy, partySize);

  // Live availability for the chosen slot, recomputed as inputs change.
  const availability = useMemo(() => {
    if (!time) return null;
    return checkAvailability({
      restaurant,
      schedule,
      reservations: allReservations,
      dateISO,
      time,
      partySize,
    });
  }, [restaurant, schedule, allReservations, dateISO, time, partySize]);

  // Slots that can't seat this party at all — disabled in the picker.
  const takenSlots = useMemo(() => {
    return slotsForDate(schedule, dateISO).filter(
      (slot) =>
        checkAvailability({
          restaurant,
          schedule,
          reservations: allReservations,
          dateISO,
          time: slot,
          partySize,
        }).level === 'unavailable',
    );
  }, [restaurant, schedule, allReservations, dateISO, partySize]);

  const nameOk = name.trim().length > 0;
  const phoneOk = isValidPhMobile(phone);
  const canSubmit = nameOk && phoneOk && Boolean(time);
  const unavailable = availability?.level === 'unavailable';
  const blockedForNonManager = unavailable && role !== 'manager';
  const submitDisabled = !canSubmit || blockedForNonManager;

  const doCreate = () => {
    onCreate(
      {
        name: name.trim(),
        phone,
        partySize,
        dateISO,
        time,
        occasion: occasion || undefined,
        notes: notes.trim() || undefined,
        source: 'phone',
      },
      depReq ? depAmount : 0,
    );
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (unavailable) {
      if (role === 'manager') setOverbookOpen(true);
      return;
    }
    doCreate();
  };

  const changeDate = (next: string) => {
    setDateISO(next);
    setTime(''); // a slot valid for one date may not exist on another
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="New reservation"
        description={restaurant.name}
        size="lg"
        footer={
          <>
            <SecondaryButton size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" disabled={submitDisabled} onClick={handleSubmit}>
              {unavailable && role === 'manager' ? 'Overbook…' : 'Add reservation'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guest name" required htmlFor="res-name">
              <TextInput
                id="res-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maria Santos"
                invalid={name.length > 0 && !nameOk}
              />
            </Field>
            <PhoneField value={phone} onChange={setPhone} label="Mobile" required id="res-phone" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Party size" htmlFor="res-party">
              <NumberStepper id="res-party" value={partySize} onChange={setPartySize} min={1} max={30} suffix="guests" />
            </Field>
            <Field label="Date" htmlFor="res-date">
              <DatePicker
                id="res-date"
                value={dateISO}
                min={today}
                onChange={(e) => changeDate(e.target.value)}
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Time" required>
            <TimeSlotPicker
              schedule={schedule}
              dateISO={dateISO}
              value={time}
              onChange={setTime}
              takenSlots={takenSlots}
            />
          </Field>

          {/* Live availability read-out */}
          {availability && (
            <div className="space-y-2 rounded-lg border border-line bg-paper/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <AvailabilityBadge result={availability} />
                <span className="text-[13px] text-mute">{availability.reason}</span>
              </div>
              {availability.combination.length >= 2 && (
                <p className="text-[13px] text-ink">
                  Combine {availability.combination.map((t) => t.label).join(' + ')} to seat{' '}
                  {partySize}.
                </p>
              )}
              {unavailable && availability.alternativeTimes.length > 0 && (
                <div>
                  <p className="mb-1 text-[13px] text-mute">Try another time:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availability.alternativeTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className="h-8 rounded-lg border border-line bg-chalk px-2.5 text-[13px] font-medium tabular-nums text-ink outline-terracotta transition-colors hover:border-terracotta hover:bg-sand"
                      >
                        {formatTime12(t)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Occasion" hint="Optional — attaches celebration handling." htmlFor="res-occasion">
              <Select
                value={occasion || 'none'}
                onValueChange={(v) => setOccasion(v === 'none' ? '' : (v as Occasion))}
                id="res-occasion"
                aria-label="Occasion"
              >
                <Option value="none">None</Option>
                {OCCASIONS.map((o) => (
                  <Option key={o.value} value={o.value}>
                    {o.label}
                  </Option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="res-notes">
            <TextArea
              id="res-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, seating preference, special requests…"
            />
          </Field>

          {/* Deposit block — only when the policy requires one for this party. */}
          {depReq && (
            <div className="space-y-1.5 rounded-lg border border-brass/30 bg-brass/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">Deposit required</span>
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatPeso(depAmount)}
                </span>
              </div>
              <p className="text-[13px] text-mute">
                Send via GCash to <span className="font-medium text-ink">{policy.gcashNumber}</span>{' '}
                ({policy.gcashName}), then upload the proof + reference in Deposits.
              </p>
              {policy.nonRefundable && (
                <p className="text-[13px] font-medium text-warn">
                  This deposit is non-refundable for this party size.
                </p>
              )}
            </div>
          )}

          {blockedForNonManager && (
            <p className="text-[13px] font-medium text-danger">
              This slot is unavailable. A manager can overbook it.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={overbookOpen}
        onOpenChange={setOverbookOpen}
        title="Overbook this slot?"
        description={
          availability
            ? `${availability.reason}. Booking anyway will exceed available tables at ${formatTime12(
                time,
              )}.`
            : undefined
        }
        confirmLabel="Overbook anyway"
        destructive
        onConfirm={() => {
          setOverbookOpen(false);
          doCreate();
        }}
      />
    </>
  );
}
