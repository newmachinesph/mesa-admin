'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A mounted, open Radix Dialog scroll-locks <body> and sets pointer-events:none on
// it — even when its content is hidden with CSS. Hiding the sheet with
// `min-[900px]:hidden` was therefore killing scroll and swallowing the first click
// on every wide-screen selection. The sheet must not be *mounted* above 900px.
function useIsCompact(): boolean {
  // false on the server and on first paint: desktop is the common case, and
  // rendering no sheet is the safe default (the inline pane is always present).
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899.98px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return compact;
}

interface MasterDetailProps {
  list: ReactNode;
  detail: ReactNode;
  // Below 900px the detail is a slide-over sheet. `open` drives it there;
  // on wide screens both panes are always visible and `open` is ignored.
  open: boolean;
  onClose: () => void;
  detailTitle?: string;
  listWidth?: string; // e.g. '22rem' — width of the list pane on desktop
  className?: string;
}

// Two-pane layout: scrollable list + detail. Detail collapses to a right-anchored
// sheet under 900px so the list stays usable on a tablet held portrait.
export function MasterDetail({
  list,
  detail,
  open,
  onClose,
  detailTitle,
  listWidth = '24rem',
  className,
}: MasterDetailProps) {
  const compact = useIsCompact();

  return (
    <div
      className={cn('flex min-h-0 flex-1', className)}
      style={{ ['--md-list-w' as string]: listWidth }}
    >
      {/* List pane — full width below 900px, fixed width beside the detail above it. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:w-[var(--md-list-w)] min-[900px]:flex-none min-[900px]:border-r min-[900px]:border-line">
        {list}
      </div>

      {/* Detail pane — inline above 900px. */}
      <div className="hidden min-h-0 min-w-0 flex-1 min-[900px]:flex min-[900px]:flex-col">
        {detail}
      </div>

      {/* Detail sheet — mounted below 900px only, never merely CSS-hidden. */}
      {compact && (
        <RadixDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <RadixDialog.Content
              className={cn(
                'fixed inset-y-0 right-0 z-50 flex w-[min(28rem,100vw)] flex-col bg-chalk shadow-[var(--shadow-lift)]',
                'data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
              )}
            >
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <RadixDialog.Title className="text-[15px] font-semibold text-ink">
                  {detailTitle ?? 'Details'}
                </RadixDialog.Title>
                <RadixDialog.Close asChild>
                  <IconButton size="sm" label="Close details">
                    <X className="size-4" />
                  </IconButton>
                </RadixDialog.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{detail}</div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      )}
    </div>
  );
}
