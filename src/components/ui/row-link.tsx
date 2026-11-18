"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Row links register here so the active row can warm the rows on either side of it. */
const warmers = new Map<string, () => void>();

function warmNeighbours(self: HTMLAnchorElement) {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>("a[data-row-link]"),
  ].filter((a) => a.offsetParent !== null);
  const i = links.indexOf(self);
  if (i === -1) return;
  for (const n of [links[i - 1], links[i + 1]]) {
    const href = n?.getAttribute("href");
    if (href) warmers.get(href)?.();
  }
}

/**
 * The link that selects a row.
 *
 * Highlight: inside a module, selecting a row is an intercepted navigation that renders only the
 * inspector panel, so the list is never re-rendered by the server. Each link therefore works out
 * from the URL whether it is the selected row; on the list URL itself it falls back to the
 * server's choice (`selected`, the row the default inspector shows).
 *
 * Prefetch: lists show hundreds of these, so nothing is prefetched on sight (measured: one
 * request per visible row, repeated after each navigation). On hover, focus or touch the link
 * prefetches the panel's full content, so the click usually renders from memory. The active row
 * warms its neighbours, which makes j / k just as quick.
 *
 * `stretch` lays the link over its whole table row; book-style cells pass `false` and style the
 * link itself.
 */
export function RowLink({
  href,
  children,
  selected,
  stretch = true,
  className,
}: {
  href: string;
  children: ReactNode;
  /** The row the server shows in the default inspector when the URL selects nothing. */
  selected?: boolean;
  stretch?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const inspecting = /\/inspect\/[^/]+\/?$/.test(pathname);
  const active = inspecting
    ? pathname === href.split("?")[0]
    : Boolean(selected);

  const [intent, setIntent] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const warm = () => setIntent(true);
    warmers.set(href, warm);
    return () => {
      if (warmers.get(href) === warm) warmers.delete(href);
    };
  }, [href]);

  useEffect(() => {
    if (!active) return;
    // Next frame: every row's registration effect has run by then.
    const frame = requestAnimationFrame(() => {
      if (ref.current) warmNeighbours(ref.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const warm = () => setIntent(true);

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={intent}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      scroll={false}
      replace
      data-row-link
      data-active={active || undefined}
      aria-current={active ? "true" : undefined}
      className={cn(stretch ? "row-link" : "cell-link", className)}
    >
      {children}
    </Link>
  );
}
