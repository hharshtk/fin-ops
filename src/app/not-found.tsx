import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ground px-4">
      <div className="max-w-sm">
        <span
          aria-hidden
          className="signal signal-lg mb-4"
          data-aspect="red"
          style={{ background: "var(--color-rail)" }}
        >
          <i />
          <i />
        </span>
        <h1 className="text-lg font-semibold">
          This page is not on the timetable
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          The link may be old, or the client code may have changed. Search from
          the Cockpit with Ctrl K.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-8 items-center rounded-[3px] bg-navy px-3 text-sm font-medium text-white hover:bg-navy-hover"
        >
          Back to the Cockpit
        </Link>
      </div>
    </main>
  );
}
