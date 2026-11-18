import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[3px] border border-current/25 px-1 font-sans text-2xs leading-none font-medium",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Avatar({
  initials,
  name,
  className,
}: {
  initials: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        "inline-grid size-6 shrink-0 place-items-center rounded-full bg-sunken text-2xs font-semibold text-ink-2 ring-1 ring-line-strong",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Empty state that teaches what would appear here and how to get it. */
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 px-4 py-8 text-sm">
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="max-w-[52ch] text-ink-2">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Data-bearing composition bar (e.g. filed / ready / awaiting) with a legend. */
export function CompositionBar({
  parts,
  className,
}: {
  parts: { label: string; value: number; className: string }[];
  className?: string;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className={className}>
      <div
        className="flex h-1.5 w-full overflow-hidden bg-sunken"
        role="img"
        aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}
      >
        {parts.map((p) =>
          p.value > 0 ? (
            <span
              key={p.label}
              className={p.className}
              style={{ width: `${(p.value / Math.max(total, 1)) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("size-2 rounded-[1px]", p.className)}
            />
            {p.label}
            <span className="font-semibold text-ink figures">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Load against a hard capacity. Overflow beyond capacity is drawn as overflow. */
export function LoadBar({
  assigned,
  capacity,
  scale = 56,
}: {
  assigned: number;
  capacity: number;
  scale?: number;
}) {
  const within = Math.min(assigned, capacity);
  const over = Math.max(assigned - capacity, 0);
  return (
    <div
      className="relative h-2.5 w-full bg-sunken"
      role="img"
      aria-label={`${assigned} of ${capacity} hours`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-navy/75"
        style={{ width: `${(within / scale) * 100}%` }}
      />
      {over > 0 && (
        <span
          className="absolute inset-y-0 bg-sig-red"
          style={{
            left: `${(capacity / scale) * 100}%`,
            width: `${(over / scale) * 100}%`,
          }}
        />
      )}
      <span
        aria-hidden
        className="absolute -inset-y-0.5 w-px bg-ink"
        style={{ left: `${(capacity / scale) * 100}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block animate-pulse rounded-[2px] bg-sunken", className)}
    />
  );
}

export function TableSkeleton({
  rows = 10,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div aria-busy="true" aria-label="Loading" className="bg-surface">
      <div className="flex h-7 items-center gap-6 border-b border-line bg-sunken px-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-2 w-14" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="flex h-7 items-center gap-6 border-b border-line px-3"
        >
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton
              key={i}
              className={cn("h-2", i === 1 ? "w-40" : "w-14")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
