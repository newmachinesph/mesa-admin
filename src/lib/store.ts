import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  seedState,
  toE164,
  upsertGuestFromReservation,
  type Deposit,
  type Guest,
  type GuestTag,
  type MesaState,
  type Reservation,
  type ReservationStatus,
  type Restaurant,
  type Role,
  type Schedule,
  type Table,
} from '@/core';

// Input to createReservation — server-assigned fields are filled in by the store.
export interface NewReservationInput {
  name: string;
  phone: string; // E.164 (PhoneField already normalises)
  partySize: number;
  dateISO: string;
  time: string;
  occasion?: Reservation['occasion'];
  notes?: string;
  source?: Reservation['source'];
  tableIds?: string[];
  status?: ReservationStatus;
}

interface MesaStore extends MesaState {
  currentUserId: string;
  activeRestaurantId: string;

  setRole: (role: Role) => void;
  setRestaurant: (id: string) => void;
  createReservation: (input: NewReservationInput) => string;
  updateReservation: (id: string, patch: Partial<Reservation>) => void;
  setStatus: (id: string, status: ReservationStatus) => void;
  assignTables: (id: string, tableIds: string[]) => void;
  updateLayout: (restaurantId: string, tables: Table[]) => void;
  updateSchedule: (scheduleId: string, patch: Partial<Schedule>) => void;
  upsertGuestTag: (guestId: string, tag: GuestTag) => void;
  removeGuestTag: (guestId: string, tagId: string) => void;
  setGuestNotes: (id: string, notes: string) => void;
  attachDeposit: (reservationId: string, deposit: Deposit) => void;
  uploadProof: (reservationId: string, uri: string, reference: string) => void;
  verifyDeposit: (reservationId: string, byUserId: string) => void;
}

const seed = seedState();

// ponytail: id from clock + counter is fine for a single-client demo store; a real
// backend hands these out. Bump the counter so two creates in the same ms differ.
let seq = 0;
const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const patchReservation = (
  reservations: Reservation[],
  id: string,
  patch: Partial<Reservation>,
): Reservation[] => reservations.map((r) => (r.id === id ? { ...r, ...patch } : r));

const patchDeposit = (
  reservations: Reservation[],
  id: string,
  fn: (d: Deposit) => Deposit,
): Reservation[] =>
  reservations.map((r) => (r.id === id && r.deposit ? { ...r, deposit: fn(r.deposit) } : r));

const patchGuest = (guests: Guest[], id: string, fn: (g: Guest) => Guest): Guest[] =>
  guests.map((g) => (g.id === id ? fn(g) : g));

export const useMesaStore = create<MesaStore>((set, get) => ({
  ...seed,
  // The seeded manager sees all three restaurants — sensible default landing role.
  currentUserId: 'u-ligaya',
  activeRestaurantId: seed.restaurants[0]?.id ?? '',

  setRole: (role) => {
    const user = get().users.find((u) => u.role === role);
    if (!user) return;
    set((s) => ({
      currentUserId: user.id,
      // Keep the active restaurant only if the new role can see it.
      activeRestaurantId: user.restaurantIds.includes(s.activeRestaurantId)
        ? s.activeRestaurantId
        : (user.restaurantIds[0] ?? s.activeRestaurantId),
    }));
  },

  setRestaurant: (id) => set({ activeRestaurantId: id }),

  createReservation: (input) => {
    const id = newId('res');
    const phone = toE164(input.phone);
    const reservation: Reservation = {
      id,
      restaurantId: get().activeRestaurantId,
      guestId: `guest-${phone}`,
      name: input.name,
      phone,
      partySize: input.partySize,
      dateISO: input.dateISO,
      time: input.time,
      occasion: input.occasion,
      notes: input.notes,
      status: input.status ?? 'pending',
      tableIds: input.tableIds ?? [],
      source: input.source ?? 'phone',
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      reservations: [...s.reservations, reservation],
      guests: upsertGuestFromReservation(s.guests, reservation),
    }));
    return id;
  },

  updateReservation: (id, patch) =>
    set((s) => ({ reservations: patchReservation(s.reservations, id, patch) })),

  setStatus: (id, status) =>
    set((s) => ({ reservations: patchReservation(s.reservations, id, { status }) })),

  assignTables: (id, tableIds) =>
    set((s) => ({ reservations: patchReservation(s.reservations, id, { tableIds }) })),

  updateLayout: (restaurantId, tables) =>
    set((s) => ({
      restaurants: s.restaurants.map((r: Restaurant) =>
        r.id === restaurantId ? { ...r, tables } : r,
      ),
    })),

  updateSchedule: (scheduleId, patch) =>
    set((s) => ({
      schedules: s.schedules.map((sc) => (sc.id === scheduleId ? { ...sc, ...patch } : sc)),
    })),

  upsertGuestTag: (guestId, tag) =>
    set((s) => ({
      guests: patchGuest(s.guests, guestId, (g) => ({
        ...g,
        tags: g.tags.some((t) => t.id === tag.id)
          ? g.tags.map((t) => (t.id === tag.id ? tag : t))
          : [...g.tags, tag],
      })),
    })),

  removeGuestTag: (guestId, tagId) =>
    set((s) => ({
      guests: patchGuest(s.guests, guestId, (g) => ({
        ...g,
        tags: g.tags.filter((t) => t.id !== tagId),
      })),
    })),

  setGuestNotes: (id, notes) =>
    set((s) => ({ guests: patchGuest(s.guests, id, (g) => ({ ...g, notes })) })),

  attachDeposit: (reservationId, deposit) =>
    set((s) => ({ reservations: patchReservation(s.reservations, reservationId, { deposit }) })),

  uploadProof: (reservationId, uri, reference) =>
    set((s) => ({
      reservations: patchDeposit(s.reservations, reservationId, (d) => ({
        ...d,
        proofUri: uri,
        reference,
        status: 'pending_review',
        uploadedAt: new Date().toISOString(),
      })),
    })),

  verifyDeposit: (reservationId, byUserId) =>
    set((s) => ({
      reservations: patchDeposit(s.reservations, reservationId, (d) => ({
        ...d,
        status: 'verified',
        verifiedBy: byUserId,
        verifiedAt: new Date().toISOString(),
      })),
    })),
}));

// --- Selectors ------------------------------------------------------------
// Hooks are thin wrappers so components subscribe to the smallest slice.

export function useRole(): Role {
  return useMesaStore((s) => s.users.find((u) => u.id === s.currentUserId)?.role ?? 'host');
}

export function useCurrentUser() {
  return useMesaStore((s) => s.users.find((u) => u.id === s.currentUserId));
}

export function useActiveRestaurant(): Restaurant | undefined {
  return useMesaStore((s) => s.restaurants.find((r) => r.id === s.activeRestaurantId));
}

export function useActiveSchedule(): Schedule | undefined {
  return useMesaStore((s) => {
    const rest = s.restaurants.find((r) => r.id === s.activeRestaurantId);
    return rest ? s.schedules.find((sc) => sc.id === rest.scheduleId) : undefined;
  });
}

// Reservations for the active restaurant, optionally filtered to one date.
export function useReservationsFor(dateISO?: string): Reservation[] {
  return useMesaStore(
    useShallow((s) =>
      s.reservations.filter(
        (r) => r.restaurantId === s.activeRestaurantId && (!dateISO || r.dateISO === dateISO),
      ),
    ),
  );
}
