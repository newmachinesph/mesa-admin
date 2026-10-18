'use client';

import type { ReactNode } from 'react';
import { SideNav } from '@/components/shell/SideNav';
import { TopBar } from '@/components/shell/TopBar';

// Portal shell: persistent nav rail + top bar, with the page in a scroll region.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
