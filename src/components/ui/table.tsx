'use client';

import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string; // CSS width, e.g. '8rem'
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKeys?: Set<string>;
  onToggleSelect?: (key: string) => void;
  activeKey?: string; // highlighted row (master-detail)
  empty?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

// Dense, hairline-ruled, zebra-free table. Optional checkbox selection column.
// Sticky header for long lists in a scroll container.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKeys,
  onToggleSelect,
  activeKey,
  empty,
  className,
  stickyHeader = true,
}: DataTableProps<T>) {
  const selectable = Boolean(onToggleSelect);
  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead
          className={cn(
            'bg-paper',
            stickyHeader && 'sticky top-0 z-10',
          )}
        >
          <tr className="border-b border-line">
            {selectable && <th className="w-10 px-3 py-2.5" />}
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-mute',
                  alignClass[col.align ?? 'left'],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="px-3 py-10 text-center text-sm text-mute">
                {empty ?? 'Nothing here yet.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = rowKey(row);
              const isSelected = selectedKeys?.has(key);
              const isActive = key === activeKey;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line transition-colors',
                    onRowClick && 'cursor-pointer',
                    isActive ? 'bg-sand' : 'hover:bg-paper',
                    isSelected && !isActive && 'bg-terracotta/[0.04]',
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => onToggleSelect?.(key)}
                        aria-label="Select row"
                        className="size-4 cursor-pointer rounded border-line text-terracotta accent-terracotta"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-2.5 text-slate',
                        alignClass[col.align ?? 'left'],
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function SearchInput({ className, ref, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
      <input
        ref={ref}
        type="search"
        className={cn(
          'h-10 w-full rounded-lg border border-line bg-chalk pl-9 pr-3 text-sm text-ink placeholder:text-mute/70',
          'transition-colors outline-none focus-visible:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/20',
          '[&::-webkit-search-cancel-button]:appearance-none',
          className,
        )}
        {...props}
      />
    </div>
  );
}
