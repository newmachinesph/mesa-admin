'use client';

import { useMemo, useState } from 'react';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { can } from '@/core';
import { useMesaStore, useRole } from '@/lib/store';
import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { MasterDetail } from '@/components/shell/MasterDetail';
import { GuestList } from './_components/GuestList';
import { GuestDetail } from './_components/GuestDetail';

// Guests CRM — group-wide (guests dedupe by mobile across restaurants). Manager
// edits; host reads; finance never lands here.
export default function GuestsPage() {
  const role = useRole();
  if (role === 'finance') redirect('/deposits');
  const canEdit = can(role, 'guest:edit');

  const guests = useMesaStore((s) => s.guests);
  const reservations = useMesaStore((s) => s.reservations);
  const restaurants = useMesaStore((s) => s.restaurants);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => guests.find((g) => g.id === selectedId) ?? null,
    [guests, selectedId],
  );

  return (
    // h-full, not flex-1: <main> is itself a scroll container, so flex-1 resolves to
    // content height and the detail pane never gets a bounded parent to scroll inside.
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-5 lg:px-6">
        <PageHeader
          eyebrow="CRM"
          title="Guests"
          subtitle={`${guests.length} guests across the group`}
        />
      </div>

      <MasterDetail
        className="mt-0"
        listWidth="26rem"
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        detailTitle={selected?.name}
        list={
          <GuestList
            guests={guests}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        detail={
          selected ? (
            <GuestDetail
              guest={selected}
              reservations={reservations}
              restaurants={restaurants}
              canEdit={canEdit}
            />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                icon={<Users />}
                title="Select a guest"
                description="Pick someone from the list to see their history, tags, and notes."
              />
            </div>
          )
        }
      />
    </div>
  );
}
