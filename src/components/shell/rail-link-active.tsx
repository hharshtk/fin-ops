"use client";

import { usePathname } from "next/navigation";
import { RailLinkView, type RailLinkProps } from "./rail-link-view";

/** Reads the pathname to mark the current module. */
export function RailLinkActive(props: RailLinkProps) {
  const pathname = usePathname();
  const active =
    props.href === "/"
      ? pathname === "/"
      : pathname === props.href || pathname.startsWith(`${props.href}/`);
  return <RailLinkView {...props} active={active} />;
}
