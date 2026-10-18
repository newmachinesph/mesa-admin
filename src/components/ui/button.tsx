import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md';

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
};

const base =
  'inline-flex items-center justify-center font-medium whitespace-nowrap select-none ' +
  'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2';

function Spinner({ size }: { size: Size }) {
  return <Loader2 className={cn('animate-spin', size === 'sm' ? 'size-3.5' : 'size-4')} />;
}

// The single primary action per screen. Terracotta — reserved, use once.
export function PrimaryButton({
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ref,
  ...props
}: BaseProps) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        base,
        sizes[size],
        'bg-terracotta text-chalk hover:bg-terracotta-d active:bg-terracotta-d outline-terracotta',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ref,
  ...props
}: BaseProps) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        base,
        sizes[size],
        'bg-chalk text-ink border border-line hover:bg-sand active:bg-sand outline-terracotta',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {children}
    </button>
  );
}

export function GhostButton({
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ref,
  ...props
}: BaseProps) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        base,
        sizes[size],
        'bg-transparent text-slate hover:bg-sand hover:text-ink active:bg-sand outline-terracotta',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  label: string; // required — icon-only buttons need an accessible name
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  size = 'md',
  label,
  children,
  className,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        base,
        'text-mute hover:bg-sand hover:text-ink active:bg-sand rounded-lg outline-terracotta',
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
