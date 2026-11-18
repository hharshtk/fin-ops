import Link from "next/link";
import type { ReactNode } from "react";
import { Signal } from "@/components/ui/signal";
import type { Aspect } from "@/domain/types";
import { cn } from "@/lib/cn";

export interface SummaryItem {
  label: string;
  value: ReactNode;
  href: string;
  aspect?: Aspect;
  tone?: "red";
}

/**
 * The signal summary line: the day's position in one row of figures, each a link to the list
 * behind it. Read left to right, worst first.
 */
export function SummaryLine({ items }: { items: SummaryItem[] }) {
  return (
    <nav
      aria-label="Today at a glance"
      className="scroll-thin overflow-x-auto border-b border-line bg-surface"
    >
      <ul className="flex min-w-max items-stretch divide-x divide-line">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="flex h-11 items-center gap-2 px-3.5 transition-colors duration-150 hover:bg-hover sm:px-4"
            >
              {it.aspect && <Signal aspect={it.aspect} />}
              <span
                className={cn(
                  "text-lg font-bold condensed tabular-nums",
                  it.tone === "red" ? "text-sig-red-ink" : "text-ink",
                )}
              >
                {it.value}
              </span>
              <span className="text-sm whitespace-nowrap text-ink-2">
                {it.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
