# mesa-admin

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![React 19](https://img.shields.io/badge/React-19-61dafb) ![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8)

The staff portal for **Mesa**, a restaurant reservation and floor-management system for the Philippine market.

This is the tool the restaurant runs on: hosts take and seat bookings, managers design the floor plan and the operating schedule, finance verifies deposits. It is multi-tenant — one login spans a restaurant group.

The diner-facing side lives in [`mesa-mobile`](https://github.com/newmachinesph/mesa-mobile). Both share [`mesa-core`](https://github.com/newmachinesph/mesa-core).

> **Frontend demo.** No backend, no network calls. All state is in memory, seeded from `mesa-core`, and resets on reload.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 (CSS-first) · Radix · zustand · vitest

## Run it

Clone the three repos as siblings, since core is vendored across them:

```
<parent>/
├── mesa-core/
├── mesa-admin/
└── mesa-mobile/
```

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm test             # vitest — runs the vendored mesa-core domain suite
npm run build        # next build
npm run sync:core    # re-copy mesa-core/src into src/core
```

`src/core` is **generated**. Never edit it — fix `mesa-core` and re-sync.

## Roles

Switch roles from the header select. It is a demo control, and it really does re-gate the UI: the nav, the actions, and the routes all read from `can(role, action)` in `mesa-core/rbac.ts`.

| | Host | Manager | Finance |
|---|---|---|---|
| Reservations | create, edit, seat, assign tables | same | — |
| Floor plan | read-only | edit | — |
| Schedule | read-only | edit | — |
| Guests | read-only | edit tags and notes | — |
| Deposits | read-only | verify, forfeit | verify, forfeit |

## What's in it

**Reservations.** Master–detail list, filterable by date, shift, status, and a search that matches `0917…` and `+63917…` alike. The new-reservation form runs a live availability check as date, time, and party size change: it will tell you the kitchen is closed 2:30–5:30, or that only one table is left, or that no single table fits a party of 12 but T4 and T5 push together. When it can't seat you it offers alternative times as chips.

**Floor plan.** A snap-to-grid canvas per zone (Main Hall, Al Fresco, Private Room…). Place a table by tapping an empty cell, drag to reposition, edit label / seats / shape / combinability. Tables render as SVG — a table top with one chair per seat, benches for booths. Tables occupied right now carry a terracotta top and the guest's name. Edits commit to the store, so availability recalculates immediately.

**Schedule.** A weekly grid where the afternoon gap between lunch and dinner is drawn explicitly as a hatched *Closed 14:30–17:30* band, because split shifts are the norm here and a schedule editor that can't express them is useless. Closed days, holiday closed-dates, and slot interval are all editable, with a live preview of the slots a guest would actually see.

**Guests.** A CRM deduped by mobile number. Visit history, no-show count, notes, and tags. Manual tags you add; auto tags (`Frequent`, `VIP`, `No-show risk`) are derived from history and cannot be removed — the lock explains the rule that produced them.

**Deposits.** The Philippine reality: a guest sends money over GCash and uploads a screenshot of the receipt. This screen is the verification queue. Review the proof image against the expected amount and reference number, then verify. A verified deposit on a no-show can be forfeited, which is the entire reason deposits exist.

## Layout

```
src/
├── app/
│   ├── (portal)/          reservations, floorplan, schedule, guests, deposits, settings
│   └── globals.css        design tokens (@theme)
├── components/
│   ├── shell/             SideNav, TopBar, MasterDetail
│   └── ui/                buttons, fields, pills, dialog, table
├── core/                  ← GENERATED from mesa-core. Do not edit.
└── lib/store.ts           zustand, seeded from core, all mutations immutable
```

## Design

Warm editorial hospitality, light theme only. Paper background, chalk surfaces, hairline rules rather than heavy shadows. Terracotta is reserved for the single primary action on a screen; brass is reserved for VIP and celebrations. Dense and tablet-first — this is a working tool at a host stand, not a consumer app.

## License

MIT. See [LICENSE](LICENSE).
