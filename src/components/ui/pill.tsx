import { X } from 'lucide-react';
import {
  statusTone,
  statusLabel,
  depositStatusTone,
  depositStatusLabel,
  type AvailabilityResult,
  type DepositStatus,
  type GuestTag,
  type Occasion,
  type ReservationStatus,
  type Tone,
} from '@/core';
import { cn } from '@/lib/utils';

// One tone → one text+bg pair. brass stays reserved for VIP/celebration.
const toneStyles: Record<Tone, string> = {
  ok: 'text-ok bg-ok-bg',
  warn: 'text-warn bg-warn-bg',
  danger: 'text-danger bg-danger-bg',
  info: 'text-info bg-info-bg',
  brass: 'text-brass bg-brass/12',
  neutral: 'text-mute bg-sand',
};

const pillBase =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5 whitespace-nowrap';

function Dot({ tone }: { tone: Tone }) {
  const dot: Record<Tone, string> = {
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    info: 'bg-info',
    brass: 'bg-brass',
    neutral: 'bg-mute',
  };
  return <span className={cn('size-1.5 rounded-full', dot[tone])} />;
}

export function StatusPill({ status }: { status: ReservationStatus }) {
  const tone = statusTone(status);
  return (
    <span className={cn(pillBase, toneStyles[tone])}>
      <Dot tone={tone} />
      {statusLabel(status)}
    </span>
  );
}

export function DepositPill({ status }: { status: DepositStatus }) {
  const tone = depositStatusTone(status);
  return (
    <span className={cn(pillBase, toneStyles[tone])}>
      <Dot tone={tone} />
      {depositStatusLabel(status)}
    </span>
  );
}

interface TagChipProps {
  tag: GuestTag;
  onRemove?: (id: string) => void;
}

// Manual + auto guest tags. Removable only when onRemove is supplied (manual tags).
export function TagChip({ tag, onRemove }: TagChipProps) {
  return (
    <span className={cn(pillBase, toneStyles[tag.tone], onRemove && 'pr-1')}>
      {tag.label}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${tag.label}`}
          onClick={() => onRemove(tag.id)}
          className="rounded-full p-0.5 opacity-60 transition hover:bg-ink/10 hover:opacity-100 focus-visible:outline-2"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

const availabilityTone: Record<AvailabilityResult['level'], Tone> = {
  available: 'ok',
  tight: 'warn',
  unavailable: 'danger',
};

const availabilityLabel: Record<AvailabilityResult['level'], string> = {
  available: 'Available',
  tight: 'Tight',
  unavailable: 'Unavailable',
};

// Shows the level and, when combined tables are needed, flags it.
export function AvailabilityBadge({ result }: { result: AvailabilityResult }) {
  const tone = availabilityTone[result.level];
  const combined = result.combination.length >= 2;
  return (
    <span className={cn(pillBase, toneStyles[tone])} title={result.reason}>
      <Dot tone={tone} />
      {availabilityLabel[result.level]}
      {combined && <span className="opacity-70">· {result.combination.length} combined</span>}
    </span>
  );
}

const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: 'Birthday',
  debut: 'Debut',
  anniversary: 'Anniversary',
  christening: 'Christening',
  graduation: 'Graduation',
  despedida: 'Despedida',
  blowout: 'Blowout',
  other: 'Occasion',
};

// Celebrations get the brass treatment — the one place brass is allowed to sing.
export function OccasionChip({ occasion }: { occasion: Occasion }) {
  return (
    <span className={cn(pillBase, 'text-brass bg-brass/12')}>{OCCASION_LABELS[occasion]}</span>
  );
}
