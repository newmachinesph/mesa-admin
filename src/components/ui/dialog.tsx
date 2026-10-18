'use client';

import type { ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GhostButton, PrimaryButton, SecondaryButton } from './button';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

// Radix Dialog with the Mesa surface treatment. Controlled via open/onOpenChange.
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-card border border-line bg-chalk shadow-[var(--shadow-lift)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-lg font-semibold tracking-tight text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-mute">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <GhostButton size="sm" className="-mr-2 -mt-1 size-8 px-0" aria-label="Close">
                <X className="size-4" />
              </GhostButton>
            </RadixDialog.Close>
          </div>
          {children && <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <SecondaryButton size="sm" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            loading={loading}
            onClick={onConfirm}
            className={destructive ? 'bg-danger hover:bg-danger/90 active:bg-danger/90 outline-danger' : undefined}
          >
            {confirmLabel}
          </PrimaryButton>
        </>
      }
    />
  );
}
