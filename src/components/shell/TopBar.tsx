'use client';

import { formatDateLong, todayISO, type Role } from '@/core';
import { useMesaStore, useCurrentUser, useRole } from '@/lib/store';
import { Select, Option } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<Role, string> = {
  manager: 'Manager',
  host: 'Host',
  finance: 'Finance',
};

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

// App chrome: tenant switcher (left) + today's date + demo role control + avatar.
export function TopBar() {
  const role = useRole();
  const user = useCurrentUser();
  const restaurants = useMesaStore((s) => s.restaurants);
  const activeRestaurantId = useMesaStore((s) => s.activeRestaurantId);
  const setRestaurant = useMesaStore((s) => s.setRestaurant);
  const setRole = useMesaStore((s) => s.setRole);

  // Only tenants the current user belongs to.
  const visible = user
    ? restaurants.filter((r) => user.restaurantIds.includes(r.id))
    : restaurants;

  return (
    <header className="flex h-14 items-center gap-3 border-b border-line bg-chalk px-4 lg:px-6">
      <div className="min-w-0 flex-1">
        <div className="max-w-56">
          <Select
            value={activeRestaurantId}
            onValueChange={setRestaurant}
            aria-label="Switch restaurant"
            className="h-9 border-transparent bg-transparent px-2 font-semibold text-ink hover:bg-paper"
          >
            {visible.map((r) => (
              <Option key={r.id} value={r.id}>
                {r.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <span className="hidden text-sm text-mute md:block">{formatDateLong(todayISO())}</span>

      <div className="hidden items-center gap-2 sm:flex">
        <div className="w-28">
          <Select
            value={role}
            onValueChange={(v) => setRole(v as Role)}
            aria-label="Switch demo role"
            className="h-9"
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <Option key={r} value={r}>
                {ROLE_LABELS[r]}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[13px] font-medium text-ink">{user?.name ?? 'Guest'}</div>
          <div className="text-[11px] text-mute">{ROLE_LABELS[role]}</div>
        </div>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full bg-olive/15 text-[13px] font-semibold text-olive',
          )}
          aria-hidden
        >
          {user ? initials(user.name) : '–'}
        </span>
      </div>
    </header>
  );
}
