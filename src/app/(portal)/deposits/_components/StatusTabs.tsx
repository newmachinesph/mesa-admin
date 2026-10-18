'use client';

import { depositStatusLabel, type DepositStatus } from '@/core';
import { cn } from '@/lib/utils';

interface Tab {
  status: DepositStatus;
  count: number;
}

interface StatusTabsProps {
  tabs: Tab[];
  value: DepositStatus;
  onChange: (status: DepositStatus) => void;
}

// Underline tabs with live counts — the deposit workflow queue selector.
export function StatusTabs({ tabs, value, onChange }: StatusTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((tab) => {
        const active = tab.status === value;
        return (
          <button
            key={tab.status}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.status)}
            className={cn(
              'relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium outline-terracotta transition-colors',
              active ? 'border-terracotta text-ink' : 'border-transparent text-mute hover:text-ink',
            )}
          >
            {depositStatusLabel(tab.status)}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                active ? 'bg-terracotta/12 text-terracotta' : 'bg-sand text-mute',
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
