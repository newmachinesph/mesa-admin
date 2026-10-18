'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PartyPopper, Users, CalendarClock, MapPin } from 'lucide-react';
import {
  can,
  checkAvailability,
  depositAmount,
  depositRequired,
  formatDateLong,
  formatPeso,
  formatPhoneLocal,
  formatTime12,
  nextStatuses,
  paymentMethodLabel,
  statusLabel,
  tagsFor,
  type Guest,
  type Reservation,
  type ReservationStatus,
  type Restaurant,
  type Role,
  type Schedule,
} from '@/core';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { EmptyState, Section } from '@/components/ui/primitives';
import { StatusPill, DepositPill, OccasionChip, TagChip } from '@/components/ui/pill';
import { cn } from '@/lib/utils';
import { guestForReservation, tableLabelsFor } from './shared';

const POSITIVE = new Set<ReservationStatus>(['confirmed', 'seated', 'completed']);
const ACTION_LABEL: Record<ReservationStatus, string> = {
  pending: 'Reopen',
  confirmed: 'Confirm',
  seated: 'Seat',
  completed: 'Complete',
  no_show: 'No-show',
  cancelled: 'Cancel',
};

interface Props {
  reservation: Reservation | null;
  restaurant: Restaurant;
  schedule: Schedule;
  guests: Guest[];
  allReservations: Reservation[];
  role: Role;
  onSetStatus: (id: string, status: ReservationStatus) => void;
  onAssignTables: (id: string, tableIds: string[]) => void;
}

export function ReservationDetail({
  reservation: r,
  restaurant,
  schedule,
  guests,
  allReservations,
  role,
  onSetStatus,
  onAssignTables,
}: Props) {
  const [tablesOpen, setTablesOpen] = useState(false);

  if (!r) {
    return (
      <div className="grid h-full place-items-center p-8">
        <EmptyState
          icon={<CalendarClock />}
          title="No reservation selected"
          description="Pick a reservation from the list to see its details, status, and deposit."
        />
      </div>
    );
  }

  const policy = restaurant.depositPolicy;
  const canEdit = can(role, 'reservation:edit');
  const canAssign = can(role, 'reservation:assignTable');
  const guest = guestForReservation(guests, r);
  const tags = guest ? tagsFor(guest) : [];
  const transitions = nextStatuses(r.status);
  const tables = tableLabelsFor(restaurant, r.tableIds);
  const zoneNames = zonesForTables(restaurant, r.tableIds);
  const dep = r.deposit;
  const depReq = depositRequired(policy, r.partySize);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-terracotta">
                {formatDateLong(r.dateISO)} · {formatTime12(r.time)}
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-ink">
                {r.name}
              </h2>
              <p className="mt-0.5 text-sm text-mute tabular-nums">{formatPhoneLocal(r.phone)}</p>
            </div>
            <StatusPill status={r.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Users className="size-4 text-mute" />
              Party of {r.partySize}
            </span>
            {r.occasion && <OccasionChip occasion={r.occasion} />}
          </div>
        </div>

        {/* Celebration flag */}
        {r.occasion && (
          <div className="flex items-center gap-2 rounded-lg border border-brass/30 bg-brass/[0.06] px-3 py-2">
            <PartyPopper className="size-4 shrink-0 text-brass" />
            <span className="text-sm text-ink">
              Celebration booking — flag the kitchen for cake corkage and set-menu.
            </span>
          </div>
        )}

        {/* Status lifecycle */}
        <Section title="Status">
          {canEdit ? (
            transitions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {transitions.map((ns) => {
                  const Button = POSITIVE.has(ns) ? PrimaryButton : SecondaryButton;
                  return (
                    <Button
                      key={ns}
                      size="sm"
                      onClick={() => onSetStatus(r.id, ns)}
                      className={
                        POSITIVE.has(ns)
                          ? undefined
                          : 'border-danger/30 text-danger hover:bg-danger-bg active:bg-danger-bg'
                      }
                    >
                      {ACTION_LABEL[ns]}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-mute">
                {statusLabel(r.status)} — no further actions from here.
              </p>
            )
          ) : (
            <p className="text-sm text-mute">You do not have permission to change status.</p>
          )}
        </Section>

        {/* Tables */}
        <Section
          title="Tables"
          actions={
            canAssign ? (
              <SecondaryButton size="sm" onClick={() => setTablesOpen(true)}>
                Change tables
              </SecondaryButton>
            ) : undefined
          }
        >
          {r.tableIds.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-ink">
              <MapPin className="size-4 shrink-0 text-mute" />
              <span className="font-medium tabular-nums">{tables}</span>
              {zoneNames && <span className="text-mute">· {zoneNames}</span>}
            </div>
          ) : (
            <p className="text-sm text-warn">No tables assigned yet.</p>
          )}
        </Section>

        {/* Guest */}
        <Section
          title="Guest"
          actions={
            guest ? (
              <Link
                href="/guests"
                className="text-[13px] font-medium text-terracotta hover:underline"
              >
                Open profile →
              </Link>
            ) : undefined
          }
        >
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-mute">No guest tags.</p>
          )}
        </Section>

        {/* Deposit */}
        <Section
          title="Deposit"
          actions={
            <Link
              href="/deposits"
              className="text-[13px] font-medium text-terracotta hover:underline"
            >
              Open in Deposits →
            </Link>
          }
        >
          {dep ? (
            <div className="space-y-2 rounded-lg border border-line bg-paper/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatPeso(dep.amount)}
                </span>
                <DepositPill status={dep.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mute">
                <span>{paymentMethodLabel(dep.method)}</span>
                {dep.reference && <span className="tabular-nums">Ref {dep.reference}</span>}
              </div>
            </div>
          ) : depReq ? (
            <div className="space-y-1 rounded-lg border border-warn/30 bg-warn-bg/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatPeso(depositAmount(policy, r.partySize))}
                </span>
                <DepositPill status="awaiting_proof" />
              </div>
              <p className="text-[13px] text-mute">
                Send via GCash to {policy.gcashNumber} ({policy.gcashName}), then capture the proof
                in Deposits.
              </p>
            </div>
          ) : (
            <p className="text-sm text-mute">No deposit required for this party size.</p>
          )}
        </Section>

        {/* Notes */}
        <Section title="Notes">
          {r.notes ? (
            <p className="whitespace-pre-wrap text-sm text-slate">{r.notes}</p>
          ) : (
            <p className="text-sm text-mute">No notes.</p>
          )}
        </Section>
      </div>

      {canAssign && (
        <ChangeTablesModal
          key={`${r.id}-${tablesOpen}`}
          open={tablesOpen}
          onOpenChange={setTablesOpen}
          reservation={r}
          restaurant={restaurant}
          schedule={schedule}
          allReservations={allReservations}
          onSave={(ids) => {
            onAssignTables(r.id, ids);
            setTablesOpen(false);
          }}
        />
      )}
    </div>
  );
}

function zonesForTables(restaurant: Restaurant, tableIds: string[]): string {
  if (tableIds.length === 0) return '';
  const zoneById = new Map(restaurant.zones.map((z) => [z.id, z.name]));
  const tableById = new Map(restaurant.tables.map((t) => [t.id, t]));
  const names = new Set<string>();
  for (const id of tableIds) {
    const zoneId = tableById.get(id)?.zoneId;
    const name = zoneId ? zoneById.get(zoneId) : undefined;
    if (name) names.add(name);
  }
  return [...names].join(', ');
}

interface TablesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  restaurant: Restaurant;
  schedule: Schedule;
  allReservations: Reservation[];
  onSave: (tableIds: string[]) => void;
}

function ChangeTablesModal({
  open,
  onOpenChange,
  reservation: r,
  restaurant,
  schedule,
  allReservations,
  onSave,
}: TablesModalProps) {
  const initial = useMemo(() => new Set(r.tableIds), [r.tableIds]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(r.tableIds));

  // Tables free at this reservation's slot, ignoring the reservation itself so its
  // own tables read as available (not blocked by their own booking).
  const freeSet = useMemo(() => {
    const result = checkAvailability({
      restaurant,
      schedule,
      reservations: allReservations,
      dateISO: r.dateISO,
      time: r.time,
      partySize: r.partySize,
      ignoreReservationId: r.id,
    });
    return new Set(result.freeTables.map((t) => t.id));
  }, [restaurant, schedule, allReservations, r.dateISO, r.time, r.partySize, r.id]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const seatSum = restaurant.tables
    .filter((t) => selected.has(t.id))
    .reduce((sum, t) => sum + t.seats, 0);
  const enough = seatSum >= r.partySize;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Change tables"
      description={`Party of ${r.partySize} · ${formatTime12(r.time)} · ${formatDateLong(r.dateISO)}`}
      size="lg"
      footer={
        <>
          <div className="mr-auto text-sm">
            <span className={cn('font-semibold tabular-nums', enough ? 'text-ok' : 'text-warn')}>
              {seatSum}
            </span>
            <span className="text-mute"> / {r.partySize} seats selected</span>
          </div>
          <SecondaryButton size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={() => onSave([...selected])}>
            Save tables
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        {restaurant.zones.map((zone) => {
          const zoneTables = restaurant.tables.filter((t) => t.zoneId === zone.id);
          if (zoneTables.length === 0) return null;
          return (
            <div key={zone.id} className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
                {zone.name}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                {zoneTables.map((t) => {
                  const isSelected = selected.has(t.id);
                  // Own tables stay selectable even though another view of "free"
                  // would exclude them; only tables held by OTHER bookings are locked.
                  const taken = !freeSet.has(t.id) && !initial.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={taken}
                      onClick={() => toggle(t.id)}
                      className={cn(
                        'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors outline-terracotta',
                        isSelected
                          ? 'border-terracotta bg-terracotta/[0.08]'
                          : 'border-line bg-chalk hover:border-terracotta hover:bg-sand',
                        taken && 'cursor-not-allowed border-line bg-paper opacity-50 hover:border-line hover:bg-paper',
                      )}
                    >
                      <span className="text-sm font-semibold tabular-nums text-ink">{t.label}</span>
                      <span className="text-[12px] tabular-nums text-mute">{t.seats} seats</span>
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          taken ? 'text-danger' : isSelected ? 'text-terracotta' : 'text-ok',
                        )}
                      >
                        {taken ? 'Booked' : isSelected ? 'Assigned' : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
