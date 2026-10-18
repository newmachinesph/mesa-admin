'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Bell, Check, Copy, ImageOff, Lock } from 'lucide-react';
import {
  can,
  depositAmount,
  formatDateLong,
  formatPeso,
  formatPhoneLocal,
  formatTime12,
  paymentMethodLabel,
  type DepositStatus,
  type Reservation,
  type Restaurant,
} from '@/core';
import { PrimaryButton, SecondaryButton, IconButton } from '@/components/ui/button';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { DepositPill, OccasionChip, StatusPill } from '@/components/ui/pill';
import { Divider } from '@/components/ui/primitives';
import { useCurrentUser, useMesaStore, useRole } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepositReviewProps {
  reservation: Reservation;
  restaurant: Restaurant;
  open: boolean;
  onClose: () => void;
  // Moves the underlying list to the tab the deposit landed in after an action.
  onMoved: (status: DepositStatus) => void;
}

function dayShort(dateISO: string): string {
  return formatDateLong(dateISO).split(', ')[1] ?? dateISO;
}

// 'YYYY-MM-DDTHH:mm:ss+08:00' -> '12 Jul · 5:30 PM'
function stampLong(iso?: string): string {
  if (!iso) return '—';
  const day = dayShort(iso.slice(0, 10));
  const time = iso.length >= 16 ? formatTime12(iso.slice(11, 16)) : '';
  return time ? `${day} · ${time}` : day;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-[13px] text-mute">{label}</span>
      <span className="text-right text-[13px] font-medium text-ink">{children}</span>
    </div>
  );
}

export function DepositReview({ reservation, restaurant, open, onClose, onMoved }: DepositReviewProps) {
  const role = useRole();
  const currentUser = useCurrentUser();
  const users = useMesaStore((s) => s.users);
  const verifyDeposit = useMesaStore((s) => s.verifyDeposit);
  const attachDeposit = useMesaStore((s) => s.attachDeposit);

  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  const deposit = reservation.deposit;
  if (!deposit) return null;

  const policy = restaurant.depositPolicy;
  const expected = depositAmount(policy, reservation.partySize);
  const mismatch = expected > 0 && expected !== deposit.amount;

  const canVerify = can(role, 'deposit:verify');
  const isAwaiting = deposit.status === 'awaiting_proof';
  const isPending = deposit.status === 'pending_review';
  const isVerified = deposit.status === 'verified';
  const isForfeited = deposit.status === 'forfeited';
  const canForfeit = isVerified && reservation.status === 'no_show' && canVerify;

  const verifierName = deposit.verifiedBy
    ? (users.find((u) => u.id === deposit.verifiedBy)?.name ?? deposit.verifiedBy)
    : undefined;

  const tableLabels =
    reservation.tableIds
      .map((id) => restaurant.tables.find((t) => t.id === id)?.label ?? id)
      .join(', ') || 'Unassigned';

  const sourceLabel =
    reservation.source === 'walk_in'
      ? 'Walk-in'
      : reservation.source.charAt(0).toUpperCase() + reservation.source.slice(1);

  async function copyReference() {
    if (!deposit?.reference) return;
    try {
      await navigator.clipboard.writeText(deposit.reference);
      setCopied(true);
      toast.success('Reference copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy reference');
    }
  }

  function remindGuest() {
    toast.success(`Reminder sent to ${reservation.name}`, {
      description: `Asked them to GCash ${formatPeso(deposit?.amount ?? 0)} to ${policy.gcashNumber} and send the screenshot.`,
    });
  }

  function doVerify() {
    setWorking(true);
    // ponytail: 400ms fake latency so the demo surfaces the button spinner; a real
    // API call replaces this. Store update is synchronous.
    setTimeout(() => {
      verifyDeposit(reservation.id, currentUser?.id ?? '');
      setWorking(false);
      setConfirmVerify(false);
      onMoved('verified');
    }, 400);
  }

  function doForfeit() {
    if (!deposit) return;
    setWorking(true);
    // ponytail: the store exposes no forfeit action, so replace the deposit whole
    // via attachDeposit — the only exposed write that can flip status to forfeited.
    setTimeout(() => {
      attachDeposit(reservation.id, { ...deposit, status: 'forfeited' });
      setWorking(false);
      setConfirmForfeit(false);
      onMoved('forfeited');
    }, 400);
  }

  const footer = (
    <>
      {!canVerify && (
        <span className="mr-auto text-xs text-mute">
          View-only — managers and finance verify deposits.
        </span>
      )}
      {canVerify && isVerified && !canForfeit && (
        <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-ok">
          <Lock className="size-3.5" /> Verified — locked
        </span>
      )}
      {canVerify && isForfeited && (
        <span className="mr-auto text-xs font-medium text-danger">Forfeited — irreversible.</span>
      )}
      <SecondaryButton size="sm" onClick={onClose}>
        Close
      </SecondaryButton>
      {canVerify && isPending && (
        <PrimaryButton size="sm" onClick={() => setConfirmVerify(true)}>
          Verify deposit
        </PrimaryButton>
      )}
      {canForfeit && (
        <PrimaryButton
          size="sm"
          className="bg-danger outline-danger hover:bg-danger/90 active:bg-danger/90"
          onClick={() => setConfirmForfeit(true)}
        >
          Forfeit deposit
        </PrimaryButton>
      )}
    </>
  );

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={reservation.name}
        description={`Party of ${reservation.partySize} · ${dayShort(reservation.dateISO)} · ${formatTime12(reservation.time)}`}
        size="lg"
        footer={footer}
      >
        <div className="flex flex-col gap-5">
          {/* Status line */}
          <div className="flex flex-wrap items-center gap-2">
            <DepositPill status={deposit.status} />
            <StatusPill status={reservation.status} />
            {reservation.occasion && <OccasionChip occasion={reservation.occasion} />}
          </div>

          {/* Proof of payment */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
              Proof of payment
            </span>
            {deposit.proofUri ? (
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-card border border-line bg-sand">
                <Image
                  src={deposit.proofUri}
                  alt={`GCash payment screenshot from ${reservation.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 384px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-paper/60 px-6 py-8 text-center">
                <ImageOff className="size-6 text-mute" />
                <p className="text-sm text-mute">
                  Waiting for {reservation.name.split(' ')[0]} to send the GCash screenshot.
                </p>
              </div>
            )}
          </div>

          {/* Awaiting-proof: where to send + remind */}
          {isAwaiting && (
            <div className="rounded-card border border-line bg-paper/60 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
                    Send deposit to
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
                    {policy.gcashNumber}
                  </p>
                  <p className="text-[13px] text-mute">{policy.gcashName} · GCash</p>
                </div>
                <SecondaryButton size="sm" onClick={remindGuest}>
                  <Bell className="size-4" />
                  Remind guest
                </SecondaryButton>
              </div>
            </div>
          )}

          {/* Reference + amounts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-line p-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-mute">
                GCash reference
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[15px] font-medium tabular-nums text-ink">
                  {deposit.reference ?? '—'}
                </span>
                {deposit.reference && (
                  <IconButton
                    size="sm"
                    label="Copy reference number"
                    onClick={copyReference}
                    className="size-7"
                  >
                    {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
                  </IconButton>
                )}
              </div>
            </div>
            <div className="rounded-card border border-line p-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-mute">
                Amount
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[17px] font-semibold tabular-nums text-ink">
                  {formatPeso(deposit.amount)}
                </span>
                <span className="text-[12px] text-mute">via {paymentMethodLabel(deposit.method)}</span>
              </div>
              <p className={cn('mt-0.5 text-xs', mismatch ? 'text-warn' : 'text-mute')}>
                {expected > 0
                  ? mismatch
                    ? `Expected ${formatPeso(expected)} — does not match`
                    : `Matches expected ${formatPeso(expected)}`
                  : 'No deposit required for this party size'}
              </p>
            </div>
          </div>

          {/* Verified provenance */}
          {isVerified && (
            <div className="flex items-center gap-2 rounded-card border border-ok/30 bg-ok-bg px-3 py-2 text-[13px] text-ok">
              <Lock className="size-4 shrink-0" />
              <span>
                Verified by <span className="font-semibold">{verifierName}</span> ·{' '}
                {stampLong(deposit.verifiedAt)}
              </span>
            </div>
          )}

          <Divider />

          {/* Linked reservation */}
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
              Reservation
            </span>
            <div className="mt-1 divide-y divide-line">
              <InfoRow label="Phone">{formatPhoneLocal(reservation.phone)}</InfoRow>
              <InfoRow label="Party size">{reservation.partySize} guests</InfoRow>
              <InfoRow label="Date">{formatDateLong(reservation.dateISO)}</InfoRow>
              <InfoRow label="Time">{formatTime12(reservation.time)}</InfoRow>
              <InfoRow label="Tables">{tableLabels}</InfoRow>
              <InfoRow label="Source">{sourceLabel}</InfoRow>
              {policy.nonRefundable && (
                <InfoRow label="Terms">
                  <span className="text-warn">Non-refundable</span>
                </InfoRow>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmVerify}
        onOpenChange={setConfirmVerify}
        title="Verify this deposit?"
        description={`Confirm the ${formatPeso(deposit.amount)} GCash payment (ref ${deposit.reference ?? '—'}) landed. Once verified it is locked and cannot be undone.`}
        confirmLabel="Verify deposit"
        loading={working}
        onConfirm={doVerify}
      />

      <ConfirmDialog
        open={confirmForfeit}
        onOpenChange={setConfirmForfeit}
        title="Forfeit this deposit?"
        description={`${reservation.name} was a no-show. Forfeiting keeps the ${formatPeso(deposit.amount)} against the booking. This is irreversible.`}
        confirmLabel="Forfeit deposit"
        destructive
        loading={working}
        onConfirm={doForfeit}
      />
    </>
  );
}
