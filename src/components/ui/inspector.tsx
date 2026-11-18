import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The right-hand inspector. On desktop it is a fixed column beside the list; under 1024px it
 * becomes a bottom sheet, shown only when something is explicitly selected.
 *
 * A list page renders a "default" inspector for its first row (or a `?sel=` row). A row clicked
 * inside the module renders in the layout's panel slot instead, as an "explicit" inspector, and
 * DefaultPanelGate hides the default one while the URL is an `/inspect/` route.
 */
export function Inspector({
  children,
  closeHref,
  explicit,
  label,
}: {
  children: ReactNode;
  closeHref?: string;
  /** False when the inspector shows a default selection; then it stays hidden on small screens. */
  explicit: boolean;
  label: string;
}) {
  return (
    <aside
      aria-label={label}
      data-inspector={explicit ? "explicit" : "default"}
      className={cn(
        "flex-col border-line bg-surface [grid-area:panel]",
        "lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:w-[21rem] lg:shrink-0 lg:self-start lg:border-l 2xl:w-[24rem]",
        explicit
          ? "fixed inset-x-0 bottom-0 z-30 flex max-h-[78dvh] border-t shadow-[0_-8px_24px_-12px_oklch(0.22_0.04_262/0.35)] lg:z-auto lg:max-h-none lg:border-t-0 lg:shadow-none"
          : "hidden",
      )}
    >
      <div className="relative min-h-0 flex-1 scroll-thin overflow-y-auto">
        {closeHref && (
          <Link
            href={closeHref}
            scroll={false}
            replace
            data-inspector-close
            aria-label="Close inspector"
            title="Close (Esc)"
            className="absolute top-2.5 right-2.5 z-10 grid size-7 place-items-center rounded-[3px] text-ink-3 hover:bg-hover hover:text-ink"
          >
            <X className="size-4" />
          </Link>
        )}
        {children}
      </div>
    </aside>
  );
}

/** Inspector heading block: title, then a meta line beneath. */
export function InspectorHead({
  title,
  meta,
  aside,
}: {
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="border-b border-line px-4 pt-3.5 pr-11 pb-3">
      <div className="flex items-start gap-2">
        {aside && <div className="pt-[3px]">{aside}</div>}
        <div className="min-w-0">
          <h2 className="text-md font-semibold text-balance">{title}</h2>
          {meta && <div className="mt-0.5 text-sm text-ink-2">{meta}</div>}
        </div>
      </div>
    </div>
  );
}

export function InspectorSection({
  title,
  children,
  actions,
  className,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-b border-line px-4 py-3 last:border-b-0",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className="caps text-ink-3">{title}</h3>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Two-column facts list. */
export function Facts({
  items,
  className,
}: {
  items: [string, ReactNode][];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm",
        className,
      )}
    >
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-3">{k}</dt>
          <dd className="min-w-0 text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InspectorActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
      {children}
    </div>
  );
}

/** Placeholder content while a panel's data streams in. */
export function InspectorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="flex flex-col gap-3 px-4 py-4"
    >
      <span className="block h-4 w-2/3 animate-pulse rounded-[2px] bg-sunken" />
      <span className="block h-3 w-1/2 animate-pulse rounded-[2px] bg-sunken" />
      <span className="mt-3 block h-7 w-40 animate-pulse rounded-[3px] bg-sunken" />
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className="block h-3 w-full animate-pulse rounded-[2px] bg-sunken"
        />
      ))}
    </div>
  );
}
