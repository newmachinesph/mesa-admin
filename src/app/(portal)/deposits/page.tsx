'use client';

import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import {
  formatDateLong,
  formatPeso,
  formatTime12,
  paymentMethodLabel,
  type DepositStatus,
  type Reservation,
} from '@/core';
import { PageHeader, Card, EmptyState } from '@/components/ui/primitives';
import { DataTable, type Column } from '@/components/ui/table';
import { DepositPill } from '@/components/ui/pill';
import { useActiveRestaurant, useReservationsFor } from '@/lib/store';
import { StatusTabs } from './_components/StatusTabs';
import { DepositReview } from './_components/DepositReview';

const TAB_ORDER: DepositStatus[] = ['awaiting_proof', 'pending_review', 'verified', 'forfeited'];

const EMPTY_COPY: Record<DepositStatus, string> = {
  none: 'No deposits.',
  awaiting_proof: 'Nobody is waiting to send proof right now.',
  pending_review: 'No proofs waiting for review — the queue is clear.',
  verified: 'No verified deposits yet.',
  forfeited: 'No forfeited deposits. Good — that means no paid no-shows.',
};

function dayShort(dateISO: string): string {
  return formatDateLong(dateISO).split(', ')[1] ?? dateISO;
}

function stampShort(iso?: string): string {
  if (!iso) return '—';
  return dayShort(iso.slice(0, 10));
}

export default function DepositsPage() {
  const reservations = useReservationsFor();
  const restaurant = useActiveRestaurant();

  const [tab, setTab] = useState<DepositStatus>('pending_review');
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // A deposit row is any reservation carrying a real (non-'none') deposit.
  const rows = useMemo(
    () => reservations.filter((r) => r.deposit && r.deposit.status !== 'none'),
    [reservations],
  );

  const counts = useMemo(() => {
    const c: Record<DepositStatus, number> = {
      none: 0,
      awaiting_proof: 0,
      pending_review: 0,
      verified: 0,
      forfeited: 0,
    };
    for (const r of rows) if (r.deposit) c[r.deposit.status]++;
    return c;
  }, [rows]);

  const tabRows = useMemo(
    () =>
      rows
        .filter((r) => r.deposit?.status === tab)
        .sort((a, b) =>
          (b.deposit?.uploadedAt ?? b.createdAt).localeCompare(a.deposit?.uploadedAt ?? a.createdAt),
        ),
    [rows, tab],
  );

  const selected = useMemo(() => rows.find((r) => r.id === selectedId), [rows, selectedId]);

  const columns: Column<Reservation>[] = [
    {
      key: 'guest',
      header: 'Guest',
      render: (r) => <span className="font-medium text-ink">{r.name}</span>,
    },
    {
      key: 'when',
      header: 'Reservation',
      render: (r) => (
        <span className="whitespace-nowrap">
          {dayShort(r.dateISO)} · {formatTime12(r.time)}
        </span>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      align: 'right',
      width: '4.5rem',
      render: (r) => <span className="tabular-nums">{r.partySize}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span className="font-medium tabular-nums text-ink">{formatPeso(r.deposit?.amount ?? 0)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (r) => (r.deposit ? paymentMethodLabel(r.deposit.method) : '—'),
    },
    {
      key: 'ref',
      header: 'Reference',
      render: (r) => (
        <span className="font-mono tabular-nums text-mute">{r.deposit?.reference ?? '—'}</span>
      ),
    },
    {
      key: 'uploaded',
      header: 'Uploaded',
      render: (r) => <span className="whitespace-nowrap text-mute">{stampShort(r.deposit?.uploadedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (r.deposit ? <DepositPill status={r.deposit.status} /> : null),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        eyebrow="Payments"
        title="Deposits"
        subtitle={
          restaurant
            ? `GCash proofs and table holds for ${restaurant.name}.`
            : 'GCash proofs and table holds.'
        }
      />

      <StatusTabs
        tabs={TAB_ORDER.map((status) => ({ status, count: counts[status] }))}
        value={tab}
        onChange={setTab}
      />

      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={tabRows}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelectedId(r.id)}
          activeKey={selectedId}
          empty={
            <EmptyState
              icon={<Receipt />}
              title="Nothing here"
              description={EMPTY_COPY[tab]}
              className="border-0 bg-transparent py-8"
            />
          }
        />
      </Card>

      {selected && restaurant && (
        <DepositReview
          reservation={selected}
          restaurant={restaurant}
          open={Boolean(selected)}
          onClose={() => setSelectedId(undefined)}
          onMoved={setTab}
        />
      )}
    </div>
  );
}
