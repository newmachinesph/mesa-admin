import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="max-w-md text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-terracotta">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-mute">
          That page isn’t on the floor plan. It may have been moved or never existed.
        </p>
        <Link
          href="/reservations"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-terracotta px-4 text-sm font-medium text-chalk transition-colors hover:bg-terracotta-d outline-terracotta"
        >
          Back to reservations
        </Link>
      </div>
    </div>
  );
}
