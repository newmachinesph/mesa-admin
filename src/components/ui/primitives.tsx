import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Chalk surface, hairline border, no heavy shadow. The base container of the app.
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-chalk border border-line rounded-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

// A titled block. Generous header, tight body — the spacing rhythm of the tool.
export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {(title || actions) && (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-mute">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-mute">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

// Big scale-contrast page title. One terracotta primary action lives in `actions`.
export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-line">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-terracotta">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'default' | 'brass' | 'ok' | 'warn' | 'danger';
}

const statAccent: Record<NonNullable<StatProps['accent']>, string> = {
  default: 'text-ink',
  brass: 'text-brass',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
};

// Dense KPI cell. Value dominates via scale; label is a quiet caption.
export function Stat({ label, value, hint, accent = 'default' }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-mute">{label}</span>
      <span className={cn('text-[26px] font-semibold leading-none tabular-nums', statAccent[accent])}>
        {value}
      </span>
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-paper/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && <div className="text-mute [&>svg]:size-7">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="text-sm text-mute max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-sand', className)} {...props} />;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />;
}

interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

// Horizontal action strip: left cluster + right cluster via justify-between.
export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
  );
}
