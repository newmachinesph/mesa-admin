'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  can,
  minutesOf,
  shiftForTime,
  todayISO,
  toE164,
  type Reservation,
  type ReservationStatus,
  type Shift,
} from '@/core';
import {
  useActiveRestaurant,
  useActiveSchedule,
  useMesaStore,
  useReservationsFor,
  useRole,
} from '@/lib/store';
import { PrimaryButton } from '@/components/ui/button';
import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { MasterDetail } from '@/components/shell/MasterDetail';
import { ReservationsToolbar } from './_components/ReservationsToolbar';
import { ReservationList } from './_components/ReservationList';
import { ReservationDetail } from './_components/ReservationDetail';
import { NewReservationModal } from './_components/NewReservationModal';
import type { FilterView } from './_components/shared';

export default function ReservationsPage() {
  const today = todayISO();
  const restaurant = useActiveRestaurant();
  const schedule = useActiveSchedule();
  const role = useRole();
  const allRes = useReservationsFor();
  const guests = useMesaStore((s) => s.guests);

  const createReservation = useMesaStore((s) => s.createReservation);
  const attachDeposit = useMesaStore((s) => s.attachDeposit);
  const setStatus = useMesaStore((s) => s.setStatus);
  const assignTables = useMesaStore((s) => s.assignTables);

  const [view, setView] = useState<FilterView>('today');
  const [date, setDate] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [status, setStatus_] = useState<string>('');
  const [query, setQuery] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newSeq, setNewSeq] = useState(0);

  const canCreate = can(role, 'reservation:create');

  // Distinct shifts across the week — the shift filter options.
  const shiftOptions = useMemo<Shift[]>(() => {
    if (!schedule) return [];
    const byId = new Map<string, Shift>();
    for (const day of schedule.days) {
      for (const s of day.shifts) if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  }, [schedule]);

  const filtered = useMemo<Reservation[]>(() => {
    if (!schedule) return [];
    let rows = allRes;

    if (date) rows = rows.filter((r) => r.dateISO === date);
    else if (view === 'today') rows = rows.filter((r) => r.dateISO === today);
    else if (view === 'upcoming') rows = rows.filter((r) => r.dateISO >= today);

    if (shiftId) rows = rows.filter((r) => shiftForTime(schedule, r.dateISO, r.time)?.id === shiftId);
    if (status) rows = rows.filter((r) => r.status === (status as ReservationStatus));

    const q = query.trim().toLowerCase();
    if (q) {
      const qDigits = q.replace(/\D/g, '');
      const qE164 = qDigits.length >= 3 ? toE164(query) : null;
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || (qE164 !== null && r.phone.includes(qE164)),
      );
    }

    return [...rows].sort((a, b) =>
      a.dateISO === b.dateISO ? minutesOf(a.time) - minutesOf(b.time) : a.dateISO < b.dateISO ? -1 : 1,
    );
  }, [allRes, schedule, date, view, today, shiftId, status, query]);

  const selected = useMemo(
    () => (selectedId ? (allRes.find((r) => r.id === selectedId) ?? null) : null),
    [allRes, selectedId],
  );

  const hasFilters = Boolean(date || shiftId || status || query.trim()) || view !== 'today';

  if (!restaurant || !schedule) {
    return (
      <div className="grid h-full place-items-center p-8">
        <EmptyState title="No restaurant selected" description="Pick a restaurant to see its book." />
      </div>
    );
  }

  const handleSelect = (r: Reservation) => {
    setSelectedId(r.id);
    setSheetOpen(true);
  };

  const openNew = () => {
    setNewSeq((n) => n + 1); // remount the form fresh
    setNewOpen(true);
  };

  return (
    // h-full, not flex-1: <main> is itself a scroll container, so flex-1 resolves to
    // content height and the detail pane never gets a bounded parent to scroll inside.
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 pt-5 pb-4">
        <PageHeader
          eyebrow={restaurant.name}
          title="Reservations"
          subtitle={`${filtered.length} ${filtered.length === 1 ? 'booking' : 'bookings'} in view`}
          actions={
            canCreate ? (
              <PrimaryButton onClick={openNew}>
                <Plus className="size-4" />
                New reservation
              </PrimaryButton>
            ) : undefined
          }
        />
      </div>

      <MasterDetail
        className="border-t border-line"
        listWidth="29rem"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        detailTitle={selected?.name ?? 'Details'}
        list={
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-line p-3">
              <ReservationsToolbar
                view={view}
                onView={(v) => {
                  setView(v);
                  setDate('');
                }}
                date={date}
                onDate={setDate}
                shiftId={shiftId}
                onShift={setShiftId}
                status={status}
                onStatus={setStatus_}
                query={query}
                onQuery={setQuery}
                shifts={shiftOptions}
                todayISO={today}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ReservationList
                reservations={filtered}
                restaurant={restaurant}
                schedule={schedule}
                selectedId={selectedId}
                onSelect={handleSelect}
                hasFilters={hasFilters}
              />
            </div>
          </div>
        }
        detail={
          <ReservationDetail
            reservation={selected}
            restaurant={restaurant}
            schedule={schedule}
            guests={guests}
            allReservations={allRes}
            role={role}
            onSetStatus={setStatus}
            onAssignTables={assignTables}
          />
        }
      />

      {canCreate && (
        <NewReservationModal
          key={newSeq}
          open={newOpen}
          onOpenChange={setNewOpen}
          restaurant={restaurant}
          schedule={schedule}
          allReservations={allRes}
          role={role}
          onCreate={(input, depositOwed) => {
            const id = createReservation(input);
            if (depositOwed > 0) {
              attachDeposit(id, {
                id: `dep-${id}`,
                amount: depositOwed,
                method: 'gcash',
                status: 'awaiting_proof',
              });
            }
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}
