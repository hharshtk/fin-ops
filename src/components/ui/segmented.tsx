import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentItem {
  label: ReactNode;
  href: string;
  active?: boolean;
  title?: string;
}

/** Link-based segmented control for mutually exclusive filters and views. */
export function Segmented({
  items,
  label,
  className,
}: {
  items: SegmentItem[];
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "inline-flex h-7 items-stretch rounded-[3px] border border-line-strong bg-sunken p-px",
        className,
      )}
    >
      {items.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          scroll={false}
          title={s.title}
          aria-current={s.active ? "true" : undefined}
          className={cn(
            "flex items-center gap-1 rounded-[2px] px-2.5 text-sm whitespace-nowrap transition-colors duration-150 [&_svg]:size-3.5",
            s.active
              ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line-strong)]"
              : "text-ink-2 hover:text-ink",
          )}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
