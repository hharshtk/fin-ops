import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabItem {
  label: string;
  href: string;
  active?: boolean;
  count?: number;
}

/** URL-driven tabs. Each tab is a link, so views are shareable and need no client state. */
export function Tabs({
  items,
  label,
  className,
}: {
  items: TabItem[];
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "flex h-9 scroll-thin items-stretch gap-4 overflow-x-auto",
        className,
      )}
    >
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "relative flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors duration-150",
            "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
            t.active
              ? "font-semibold text-ink after:bg-navy"
              : "text-ink-2 hover:text-ink hover:after:bg-line-strong",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                "text-xs figures",
                t.active ? "text-ink-2" : "text-ink-3",
              )}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
