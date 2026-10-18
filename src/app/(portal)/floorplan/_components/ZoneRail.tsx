'use client';

import { useState } from 'react';
import { Link2, Link2Off, Lock, Unlink } from 'lucide-react';
import type { Table } from '@/core';
import { SecondaryButton } from '@/components/ui/button';
import { Card, EmptyState, Section, Stat } from '@/components/ui/primitives';
import { Option, Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { areAdjacent, combinablePairs, zoneStats } from './floorplan-utils';

interface ZoneRailProps {
  zoneName: string;
  zoneTables: Table[];
  editable: boolean;
  onToggleCombine: (aId: string, bId: string) => void;
}

// Right rail: zone summary, the combinable-pairs list availability relies on,
// and a manager control to link/unlink two adjacent tables.
export function ZoneRail({ zoneName, zoneTables, editable, onToggleCombine }: ZoneRailProps) {
  const stats = zoneStats(zoneTables);
  const pairs = combinablePairs(zoneTables);

  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');
  const a = zoneTables.find((t) => t.id === aId);
  const b = zoneTables.find((t) => t.id === bId);

  const bothPicked = Boolean(a && b) && aId !== bId;
  const alreadyLinked = Boolean(a && b && a.combinableWith.includes(b.id));
  const adjacent = a && b ? areAdjacent(a, b) : false;
  const canToggle = bothPicked && (alreadyLinked || adjacent);

  const hint = !bothPicked
    ? 'Pick two tables to link them.'
    : alreadyLinked
      ? 'These tables are linked — unlink to split them.'
      : adjacent
        ? 'These tables are adjacent and can be combined.'
        : 'Tables must be adjacent on the grid to combine.';

  return (
    <div className="flex flex-col gap-6">
      {!editable && (
        <Card className="flex items-start gap-2.5 bg-sand/50 px-3.5 py-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-mute" />
          <p className="text-[13px] text-slate">
            <span className="font-medium text-ink">Manager access required to edit.</span> You can
            review the layout but changes are disabled.
          </p>
        </Card>
      )}

      <Section title={`${zoneName} — summary`}>
        <Card className="grid grid-cols-3 gap-3 px-4 py-4">
          <Stat label="Tables" value={stats.tableCount} />
          <Stat label="Seats" value={stats.totalSeats} />
          <Stat label="Largest party" value={stats.largestSeatable || '—'} accent="brass" />
        </Card>
      </Section>

      <Section title="Combinable pairs" description="Feeds the reservation availability check.">
        {pairs.length === 0 ? (
          <EmptyState
            title="No combinable pairs"
            description="Link two adjacent tables so large parties can be seated across both."
            icon={<Link2Off />}
          />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {pairs.map(([p, q]) => (
              <li
                key={`${p.id}|${q.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-chalk px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-ink">
                  <Link2 className="size-3.5 text-mute" />
                  <span className="font-medium">
                    {p.label} + {q.label}
                  </span>
                  <span className="text-xs text-mute">{p.seats + q.seats} seats</span>
                </span>
                {editable && (
                  <button
                    type="button"
                    aria-label={`Unlink ${p.label} and ${q.label}`}
                    onClick={() => onToggleCombine(p.id, q.id)}
                    className="rounded-md p-1 text-mute outline-terracotta transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <Unlink className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {editable && (
        <Section title="Link tables">
          <Card className="flex flex-col gap-3 px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Select value={aId} onValueChange={setAId} placeholder="Table A" aria-label="First table">
                {zoneTables.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.label} · {t.seats}
                  </Option>
                ))}
              </Select>
              <Select value={bId} onValueChange={setBId} placeholder="Table B" aria-label="Second table">
                {zoneTables.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.label} · {t.seats}
                  </Option>
                ))}
              </Select>
            </div>
            <p className={cn('text-xs', canToggle ? 'text-mute' : 'text-mute/80')}>{hint}</p>
            <SecondaryButton
              size="sm"
              disabled={!canToggle}
              onClick={() => {
                if (a && b) onToggleCombine(a.id, b.id);
              }}
              className="self-start"
            >
              {alreadyLinked ? <Unlink className="size-4" /> : <Link2 className="size-4" />}
              {alreadyLinked ? 'Unlink pair' : 'Combine pair'}
            </SecondaryButton>
          </Card>
        </Section>
      )}
    </div>
  );
}
