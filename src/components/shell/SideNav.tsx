'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  LayoutDashboard,
  Grid3x3,
  Clock,
  Users,
  Wallet,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { navFor } from '@/core';
import { useRole } from '@/lib/store';
import { cn } from '@/lib/utils';

// Icon per nav route. navFor() owns which routes a role sees; this only decorates.
const ICONS: Record<string, LucideIcon> = {
  '/reservations': CalendarDays,
  '/floorplan': Grid3x3,
  '/schedule': Clock,
  '/guests': Users,
  '/deposits': Wallet,
  '/settings': Settings,
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Persistent left nav. Full labels on desktop; collapses to an icon rail < 1024px.
export function SideNav() {
  const role = useRole();
  const pathname = usePathname();
  const items = navFor(role);

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full w-16 flex-col border-r border-line bg-chalk lg:w-56"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-3 lg:px-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-terracotta text-sm font-semibold text-chalk">
          M
        </span>
        <span className="hidden text-[15px] font-semibold tracking-tight text-ink lg:block">
          Mesa
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-0.5 p-2 lg:p-3">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors lg:px-3',
                  'justify-center lg:justify-start outline-terracotta',
                  active
                    ? 'bg-sand text-ink'
                    : 'text-mute hover:bg-paper hover:text-ink',
                )}
              >
                <Icon className={cn('size-5 shrink-0', active && 'text-terracotta')} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
