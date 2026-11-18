"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps a list's default inspector. When the URL selects a row (`/inspect/<id>`), the selection
 * renders in the layout's panel slot, so the default steps aside. Reading the router's pathname
 * keeps this in the same render as the panel, with no flash of two inspectors.
 */
export function DefaultPanelGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const inspecting = /\/inspect\/[^/]+\/?$/.test(pathname);
  return (
    <div className="contents" hidden={inspecting}>
      {children}
    </div>
  );
}
