import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RailLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  countTone?: "red" | "neutral";
  chord?: string;
  /** Collapse to icon-only below 1440px. */
  compact?: boolean;
}

/** Rail entry markup. Rendered by the server as the static fallback and by the client when active. */
export function RailLinkView({
  href,
  label,
  icon,
  count,
  countTone = "neutral",
  chord,
  compact = true,
  active,
}: RailLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={compact ? `${label}${chord ? ` (g ${chord})` : ""}` : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-[3px] px-2 text-sm transition-colors duration-150",
        compact && "max-[90rem]:justify-center max-[90rem]:px-0",
        active
          ? "bg-rail-raised font-medium text-rail-ink"
          : "text-rail-ink-2 hover:bg-rail-raised/60 hover:text-rail-ink",
      )}
    >
      {icon}
      <span className={cn("truncate", compact && "max-[90rem]:sr-only")}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "ml-auto text-xs figures",
            compact &&
              "max-[90rem]:absolute max-[90rem]:top-0.5 max-[90rem]:right-0.5 max-[90rem]:ml-0 max-[90rem]:text-[10px]",
            countTone === "red"
              ? "font-semibold text-[oklch(0.78_0.13_32)]"
              : "text-rail-ink-2",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
