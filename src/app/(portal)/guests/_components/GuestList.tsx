'use client';

import { useMemo, useState } from 'react';
import {
  formatDateLong,
  formatPhoneLocal,
  tagsFor,
  toE164,
  type Guest,
  type GuestTag,
  type Tone,
} from '@/core';
import { SearchInput } from '@/components/ui/table';
import { Select, Option } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

// ponytail: mirrors pill.tsx toneStyles (not exported there). 6 lines beats a
// shared module for one caller.
const toneChip: Record<Tone, string> = {
  ok: 'text-ok bg-ok-bg',
  warn: 'text-warn bg-warn-bg',
  danger: 'text-danger bg-danger-bg',
  info: 'text-info bg-info-bg',
  brass: 'text-brass bg-brass/12',
  neutral: 'text-mute bg-sand',
};

type SortKey = 'last-visit' | 'visits' | 'no-shows';

function MiniTag({ tag }: { tag: GuestTag }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4',
        toneChip[tag.tone],
      )}
    >
      {tag.kind === 'auto' && <span className="size-1 rounded-full bg-current opacity-80" />}
      {tag.label}
    </span>
  );
}

interface GuestListProps {
  guests: Guest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function GuestList({ guests, selectedId, onSelect }: GuestListProps) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('last-visit');

  // Resolve every guest's full tag set once — reused for chips, filter, and sort.
  const tagged = useMemo(
    () => guests.map((g) => ({ guest: g, tags: tagsFor(g) })),
    [guests],
  );

  // Union of tag labels present across the roster, for the filter chip row.
  const tagLabels = useMemo(() => {
    const seen = new Map<string, GuestTag>();
    for (const { tags } of tagged) for (const t of tags) if (!seen.has(t.label)) seen.set(t.label, t);
    return [...seen.values()];
  }, [tagged]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasDigit = /\d/.test(query);
    const e164q = hasDigit ? toE164(query) : '';

    const filtered = tagged.filter(({ guest, tags }) => {
      if (activeTag && !tags.some((t) => t.label === activeTag)) return false;
      if (!q) return true;
      const nameMatch = guest.name.toLowerCase().includes(q);
      const phoneMatch = hasDigit && toE164(guest.phone).includes(e164q);
      return nameMatch || phoneMatch;
    });

    const byLast = (v?: string) => (v ? v : ''); // ISO strings sort lexically
    filtered.sort((a, b) => {
      if (sort === 'visits') return b.guest.visitCount - a.guest.visitCount;
      if (sort === 'no-shows') return b.guest.noShowCount - a.guest.noShowCount;
      return byLast(b.guest.lastVisit).localeCompare(byLast(a.guest.lastVisit));
    });
    return filtered;
  }, [tagged, query, activeTag, sort]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or mobile…"
          aria-label="Search guests"
        />

        {tagLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tagLabels.map((t) => {
              const on = activeTag === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setActiveTag(on ? null : t.label)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 outline-terracotta transition',
                    on
                      ? 'bg-ink text-chalk'
                      : cn(toneChip[t.tone], 'opacity-70 hover:opacity-100'),
                  )}
                >
                  {t.kind === 'auto' && (
                    <span className="size-1 rounded-full bg-current opacity-80" />
                  )}
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-mute">Guests are matched by mobile number.</p>
          <div className="w-36 shrink-0">
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
              aria-label="Sort guests"
              className="h-8 text-[13px]"
            >
              <Option value="last-visit">Last visit</Option>
              <Option value="visits">Most visits</Option>
              <Option value="no-shows">Most no-shows</Option>
            </Select>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No guests match"
              description="Try a different name, number, or clear the tag filter."
            />
          </div>
        ) : (
          <ul>
            {rows.map(({ guest, tags }) => {
              const active = guest.id === selectedId;
              return (
                <li key={guest.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(guest.id)}
                    aria-current={active}
                    className={cn(
                      'flex w-full flex-col gap-1.5 border-b border-line px-4 py-3 text-left outline-terracotta transition-colors',
                      active ? 'bg-sand' : 'hover:bg-paper',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{guest.name}</span>
                      <span className="shrink-0 text-[12px] tabular-nums text-mute">
                        {formatPhoneLocal(guest.phone)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-mute">
                      <span className="tabular-nums">{guest.visitCount} visits</span>
                      {guest.noShowCount > 0 && (
                        <span className="tabular-nums text-danger">
                          {guest.noShowCount} no-show{guest.noShowCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="ml-auto shrink-0">
                        {guest.lastVisit ? formatDateLong(guest.lastVisit) : 'No visits yet'}
                      </span>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <MiniTag key={t.id} tag={t} />
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
