'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import {
  formatDateLong,
  formatPhoneLocal,
  tagsFor,
  type Guest,
  type Reservation,
  type Restaurant,
} from '@/core';
import { Section, Stat, Divider, EmptyState } from '@/components/ui/primitives';
import { StatusPill, DepositPill, OccasionChip } from '@/components/ui/pill';
import { cn } from '@/lib/utils';
import { GuestTags } from './GuestTags';
import { GuestNotes } from './GuestNotes';

interface GuestDetailProps {
  guest: Guest;
  reservations: Reservation[];
  restaurants: Restaurant[];
  canEdit: boolean;
}

export function GuestDetail({ guest, reservations, restaurants, canEdit }: GuestDetailProps) {
  const isVip = useMemo(() => tagsFor(guest).some((t) => t.label === 'VIP'), [guest]);

  // Restaurant + table lookups for the visit history rows.
  const restaurantById = useMemo(
    () => new Map(restaurants.map((r) => [r.id, r])),
    [restaurants],
  );

  const history = useMemo(
    () =>
      reservations
        .filter((r) => r.guestId === guest.id)
        .sort((a, b) => (b.dateISO + b.time).localeCompare(a.dateISO + a.time)),
    [reservations, guest.id],
  );

  const total = guest.visitCount + guest.noShowCount;
  const noShowRate = total > 0 ? Math.round((guest.noShowCount / total) * 100) : 0;

  const tableLabels = (r: Reservation): string => {
    const rest = restaurantById.get(r.restaurantId);
    if (!rest || r.tableIds.length === 0) return '—';
    return r.tableIds
      .map((id) => rest.tables.find((t) => t.id === id)?.label ?? id)
      .join(', ');
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-7 px-5 py-6 lg:px-7">
        {/* Header */}
        <header
          className={cn(
            'flex flex-wrap items-start justify-between gap-4 rounded-card border p-5',
            isVip ? 'border-brass/40 bg-brass/[0.06]' : 'border-line bg-chalk',
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isVip && <Crown className="size-5 text-brass" aria-hidden />}
              <h2 className="truncate text-xl font-semibold tracking-tight text-ink">
                {guest.name}
              </h2>
            </div>
            <p className="mt-1 text-sm tabular-nums text-mute">{formatPhoneLocal(guest.phone)}</p>
            {guest.email && <p className="text-sm text-mute">{guest.email}</p>}
          </div>
          {isVip && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brass/12 px-3 py-1 text-[12px] font-semibold text-brass">
              VIP guest
            </span>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <Stat label="Visits" value={guest.visitCount} />
          <Stat
            label="No-shows"
            value={guest.noShowCount}
            accent={guest.noShowCount >= 2 ? 'danger' : 'default'}
          />
          <Stat
            label="No-show rate"
            value={`${noShowRate}%`}
            accent={noShowRate >= 20 ? 'warn' : 'default'}
          />
          <Stat
            label="First visit"
            value={<span className="text-base">{guest.firstVisit ? formatDateLong(guest.firstVisit) : '—'}</span>}
          />
          <Stat
            label="Last visit"
            value={<span className="text-base">{guest.lastVisit ? formatDateLong(guest.lastVisit) : '—'}</span>}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-mute">
              Occasions
            </span>
            {guest.occasions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {guest.occasions.map((o) => (
                  <OccasionChip key={o} occasion={o} />
                ))}
              </div>
            ) : (
              <span className="text-sm text-mute">None on record</span>
            )}
          </div>
        </div>

        <Divider />

        {/* Tags */}
        <Section
          title="Tags"
          description={
            canEdit ? 'Auto tags are derived from history and locked.' : undefined
          }
        >
          <GuestTags guest={guest} canEdit={canEdit} />
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <GuestNotes key={guest.id} guest={guest} canEdit={canEdit} />
        </Section>

        {/* Visit history */}
        <Section title="Visit history" description={`${history.length} bookings`}>
          {history.length === 0 ? (
            <EmptyState title="No bookings yet" description="This guest has no reservations on record." />
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
              {history.map((r) => {
                const rest = restaurantById.get(r.restaurantId);
                return (
                  <li key={r.id}>
                    <Link
                      href="/reservations"
                      className="flex flex-col gap-2 px-4 py-3 outline-terracotta transition-colors hover:bg-paper"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">
                          {formatDateLong(r.dateISO)}
                        </span>
                        <StatusPill status={r.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mute">
                        <span>{rest?.name ?? 'Unknown venue'}</span>
                        <span className="tabular-nums">Party of {r.partySize}</span>
                        <span>Table {tableLabels(r)}</span>
                      </div>
                      {(r.occasion || r.deposit) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {r.occasion && <OccasionChip occasion={r.occasion} />}
                          {r.deposit && <DepositPill status={r.deposit.status} />}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
