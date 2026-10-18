import { Globe, Phone, Footprints } from 'lucide-react';
import {
  depositRequired,
  toE164,
  type DepositStatus,
  type Guest,
  type Reservation,
  type Restaurant,
} from '@/core';

// Coarse date range for the list. A picked date overrides this.
export type FilterView = 'today' | 'upcoming' | 'all';

const SOURCE_META = {
  online: { Icon: Globe, label: 'Booked online' },
  phone: { Icon: Phone, label: 'Booked by phone' },
  walk_in: { Icon: Footprints, label: 'Walk-in' },
} as const;

export function SourceIcon({ source }: { source: Reservation['source'] }) {
  const { Icon, label } = SOURCE_META[source];
  return (
    <span title={label}>
      <Icon className="size-3.5 text-mute" role="img" aria-label={label} />
    </span>
  );
}

// 'T4 + T5' or '' when unassigned.
export function tableLabelsFor(restaurant: Restaurant, tableIds: string[]): string {
  if (tableIds.length === 0) return '';
  const byId = new Map(restaurant.tables.map((t) => [t.id, t.label]));
  return tableIds.map((id) => byId.get(id) ?? id).join(' + ');
}

// Reservations carry a guestId, but a booking made under an existing guest's phone
// keeps that guest's original id — so fall back to matching on E.164 phone.
export function guestForReservation(guests: Guest[], r: Reservation): Guest | undefined {
  const byId = guests.find((g) => g.id === r.guestId);
  if (byId) return byId;
  const key = toE164(r.phone);
  return guests.find((g) => toE164(g.phone) === key);
}

// The status to show in a pill: the real deposit's, or 'awaiting_proof' when the
// policy demands one that hasn't been captured yet, else 'none' (no pill).
export function depositStatusFor(r: Reservation, restaurant: Restaurant): DepositStatus {
  if (r.deposit) return r.deposit.status;
  return depositRequired(restaurant.depositPolicy, r.partySize) ? 'awaiting_proof' : 'none';
}
