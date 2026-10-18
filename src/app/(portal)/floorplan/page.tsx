'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LayoutGrid } from 'lucide-react';
import { can, todayISO, type Table } from '@/core';
import {
  useActiveRestaurant,
  useMesaStore,
  useReservationsFor,
  useRole,
} from '@/lib/store';
import { PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { FloorCanvas } from './_components/FloorCanvas';
import { TableEditor } from './_components/TableEditor';
import { ZoneRail } from './_components/ZoneRail';
import { nowManilaMinutes, occupiedTableMap, toggleCombinable } from './_components/floorplan-utils';

type EditorTarget =
  | { kind: 'edit'; table: Table }
  | { kind: 'new'; cell: { x: number; y: number } };

export default function FloorPlanPage() {
  const role = useRole();
  const editable = can(role, 'floorplan:edit');
  const restaurant = useActiveRestaurant();
  const updateLayout = useMesaStore((s) => s.updateLayout);
  const todaysReservations = useReservationsFor(todayISO());

  const zones = restaurant?.zones ?? [];
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  if (!restaurant) {
    return <div className="p-6 text-sm text-mute">No restaurant selected.</div>;
  }

  const tables = restaurant.tables;
  // Fall back to the first zone if the selection is stale (e.g. after switching branch).
  const zoneId = zones.some((z) => z.id === selectedZoneId) ? selectedZoneId : (zones[0]?.id ?? '');
  const activeZone = zones.find((z) => z.id === zoneId);
  const zoneTables = tables.filter((t) => t.zoneId === zoneId);
  const occupied = occupiedTableMap(todaysReservations, nowManilaMinutes());

  // Every mutation flows through here: commit the full layout, then flag the recalc.
  const applyLayout = (next: Table[]) => {
    updateLayout(restaurant.id, next);
    toast.success('Availability recalculated', {
      description: 'Reservation availability now reflects this layout.',
    });
  };

  const moveTable = (id: string, x: number, y: number) =>
    applyLayout(tables.map((t) => (t.id === id ? { ...t, gridX: x, gridY: y } : t)));

  const submitTable = (table: Table) =>
    applyLayout(
      tables.some((t) => t.id === table.id)
        ? tables.map((t) => (t.id === table.id ? table : t))
        : [...tables, table],
    );

  const deleteTable = (id: string) =>
    applyLayout(
      tables
        .filter((t) => t.id !== id)
        .map((t) =>
          t.combinableWith.includes(id)
            ? { ...t, combinableWith: t.combinableWith.filter((x) => x !== id) }
            : t,
        ),
    );

  const editorKey = editor
    ? editor.kind === 'edit'
      ? editor.table.id
      : `new-${editor.cell.x}-${editor.cell.y}`
    : 'closed';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-5 lg:p-6">
      <PageHeader
        eyebrow={restaurant.name}
        title="Floor plan"
        subtitle={
          editable
            ? 'Tap a cell to add a table, tap a table to edit, drag to rearrange.'
            : 'Read-only view of the seating layout.'
        }
      />

      {/* Zone tabs */}
      <div className="flex flex-wrap gap-1 border-b border-line">
        {zones.map((z) => {
          const count = tables.filter((t) => t.zoneId === z.id).length;
          const active = z.id === zoneId;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedZoneId(z.id)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors outline-terracotta',
                active
                  ? 'border-terracotta text-ink'
                  : 'border-transparent text-mute hover:text-ink',
              )}
            >
              {z.name}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums',
                  active ? 'bg-terracotta/12 text-terracotta' : 'bg-sand text-mute',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <FloorCanvas
            zoneTables={zoneTables}
            occupied={occupied}
            editable={editable}
            selectedId={editor?.kind === 'edit' ? editor.table.id : undefined}
            onEdit={(table) => setEditor({ kind: 'edit', table })}
            onMove={moveTable}
            onPlace={(x, y) => setEditor({ kind: 'new', cell: { x, y } })}
          />
          {zoneTables.length === 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-mute">
              <LayoutGrid className="size-4" />
              {editable
                ? 'No tables in this zone yet — tap any cell to add one.'
                : 'No tables in this zone.'}
            </p>
          )}
        </div>

        <div className="shrink-0 xl:w-80">
          <ZoneRail
            zoneName={activeZone?.name ?? 'Zone'}
            zoneTables={zoneTables}
            editable={editable}
            onToggleCombine={(a, b) => applyLayout(toggleCombinable(tables, a, b))}
          />
        </div>
      </div>

      {editor && (
        <TableEditor
          key={editorKey}
          open
          onOpenChange={(o) => {
            if (!o) setEditor(null);
          }}
          table={editor.kind === 'edit' ? editor.table : undefined}
          cell={editor.kind === 'new' ? editor.cell : undefined}
          zones={zones}
          restaurantId={restaurant.id}
          defaultZoneId={zoneId}
          onSubmit={submitTable}
          onDelete={deleteTable}
        />
      )}
    </div>
  );
}
