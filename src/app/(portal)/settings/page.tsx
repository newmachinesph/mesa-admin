'use client';

import { Check, Minus } from 'lucide-react';
import {
  can,
  formatPeso,
  paymentMethodLabel,
  type Role,
} from '@/core';
import { PageHeader, Section, Card, Stat, Divider } from '@/components/ui/primitives';
import {
  useActiveRestaurant,
  useCurrentUser,
  useMesaStore,
  useRole,
} from '@/lib/store';
import { cn } from '@/lib/utils';

const ROLES: Role[] = ['host', 'manager', 'finance'];

const ROLE_LABEL: Record<Role, string> = {
  host: 'Host',
  manager: 'Manager',
  finance: 'Finance',
};

const ROLE_BLURB: Record<Role, string> = {
  host: 'Front-of-house — books tables and greets guests.',
  manager: 'Full run of the house — every screen, every control.',
  finance: 'Money only — verifies and forfeits deposits.',
};

// Capabilities expressed as can() actions, in plain English for the matrix.
const CAPS: { action: string; label: string }[] = [
  { action: 'reservation:create', label: 'Create & edit reservations' },
  { action: 'reservation:assignTable', label: 'Assign tables' },
  { action: 'floorplan:edit', label: 'Edit the floor plan' },
  { action: 'schedule:edit', label: 'Edit schedules & hours' },
  { action: 'guest:edit', label: 'Edit guest profiles' },
  { action: 'deposit:view', label: 'View deposits' },
  { action: 'deposit:verify', label: 'Verify & forfeit deposits' },
];

export default function SettingsPage() {
  const role = useRole();
  const currentUser = useCurrentUser();
  const activeRestaurant = useActiveRestaurant();
  const restaurants = useMesaStore((s) => s.restaurants);
  const activeRestaurantId = useMesaStore((s) => s.activeRestaurantId);
  const setRole = useMesaStore((s) => s.setRole);
  const setRestaurant = useMesaStore((s) => s.setRestaurant);

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Switch demo roles and restaurants, and review how the group is configured."
      />

      {/* Role switcher — the headline control */}
      <Section
        title="Demo role"
        description="Switch the acting role. The sidebar re-gates immediately via navFor()."
      >
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="inline-flex rounded-lg border border-line bg-paper p-1"
              role="radiogroup"
              aria-label="Demo role"
            >
              {ROLES.map((r) => {
                const active = r === role;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(r)}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-medium outline-terracotta transition-colors',
                      active
                        ? 'bg-chalk text-ink shadow-[var(--shadow-soft)]'
                        : 'text-mute hover:text-ink',
                    )}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                );
              })}
            </div>
            {currentUser && (
              <p className="text-sm text-mute">
                Acting as <span className="font-medium text-ink">{currentUser.name}</span> ·{' '}
                {ROLE_BLURB[role]}
              </p>
            )}
          </div>

          <Divider className="my-5" />

          {/* Permission matrix generated from can() */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-mute">
                    Capability
                  </th>
                  {ROLES.map((r) => (
                    <th
                      key={r}
                      className={cn(
                        'px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.05em]',
                        r === role ? 'text-terracotta' : 'text-mute',
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPS.map((cap) => (
                  <tr key={cap.action} className="border-b border-line">
                    <td className="px-3 py-2.5 text-slate">{cap.label}</td>
                    {ROLES.map((r) => {
                      const allowed = can(r, cap.action);
                      return (
                        <td
                          key={r}
                          className={cn('px-3 py-2.5 text-center', r === role && 'bg-sand/50')}
                        >
                          {allowed ? (
                            <Check className="mx-auto size-4 text-ok" aria-label="Allowed" />
                          ) : (
                            <Minus className="mx-auto size-4 text-mute/40" aria-label="Not allowed" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Restaurant switcher + deposit policy */}
      <Section
        title="Restaurants"
        description="Mesa Hospitality Group runs three houses. Tap one to make it active."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {restaurants.map((rest) => {
            const seats = rest.tables.reduce((sum, t) => sum + t.seats, 0);
            const active = rest.id === activeRestaurantId;
            const accessible = currentUser?.restaurantIds.includes(rest.id) ?? false;
            const policy = rest.depositPolicy;
            return (
              <Card
                key={rest.id}
                onClick={accessible ? () => setRestaurant(rest.id) : undefined}
                aria-current={active}
                className={cn(
                  'flex flex-col p-4 transition-colors',
                  accessible ? 'cursor-pointer hover:border-terracotta/50' : 'opacity-60',
                  active && 'border-terracotta ring-1 ring-terracotta/20',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-ink">{rest.name}</h3>
                    <p className="text-[13px] text-mute">{rest.cuisine}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-sand px-1.5 py-0.5 text-[13px] font-medium tabular-nums text-slate">
                    {rest.priceBand}
                  </span>
                </div>
                <p className="mt-1 text-xs text-mute">{rest.address}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-paper/70 p-3">
                  <Stat label="Zones" value={rest.zones.length} />
                  <Stat label="Tables" value={rest.tables.length} />
                  <Stat label="Seats" value={seats} />
                </div>

                <Divider className="my-4" />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mute">
                    Deposit policy
                  </span>
                  <p className="text-[13px] text-slate">
                    Required from parties of{' '}
                    <span className="font-medium text-ink">{policy.requiredFromPartySize}+</span> —{' '}
                    <span className="font-medium text-ink">
                      {policy.perHead
                        ? `${formatPeso(policy.amount)} / head`
                        : `${formatPeso(policy.amount)} flat`}
                    </span>
                    {policy.nonRefundable && <span className="text-warn"> · non-refundable</span>}
                  </p>
                  <p className="text-[13px] text-mute">
                    {policy.methods.map(paymentMethodLabel).join(' · ')}
                  </p>
                  <p className="text-[13px] text-mute">
                    GCash <span className="font-medium tabular-nums text-slate">{policy.gcashNumber}</span> ·{' '}
                    {policy.gcashName}
                  </p>
                </div>

                {!accessible && (
                  <p className="mt-3 text-[12px] text-mute">Not in your access as {ROLE_LABEL[role]}.</p>
                )}
                {active && (
                  <p className="mt-3 text-[12px] font-medium text-terracotta">Active restaurant</p>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      {/* About this demo */}
      <Section title="About this demo">
        <Card className="p-5">
          <p className="text-sm text-slate">
            {activeRestaurant?.name ?? 'Mesa'} is running on an in-memory demo store. Everything you
            change here is frontend-only:
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-mute">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-terracotta" />
              No backend — all state lives in the browser and resets on reload.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-terracotta" />
              Role and restaurant switches are instant, no login.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-terracotta" />
              Times are fixed to Asia/Manila (UTC+8) — no daylight saving, ever.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-terracotta" />
              &ldquo;Remind guest&rdquo; and payment proofs are simulated — no real SMS or money moves.
            </li>
          </ul>
        </Card>
      </Section>
    </div>
  );
}
