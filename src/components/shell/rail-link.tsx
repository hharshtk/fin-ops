import { Suspense } from "react";
import { RailLinkActive } from "./rail-link-active";
import { RailLinkView, type RailLinkProps } from "./rail-link-view";

/**
 * Rail entry. The static shell renders it inactive; the active state streams in from the client,
 * so dynamic routes still prerender.
 */
export function RailLink(props: RailLinkProps) {
  return (
    <Suspense fallback={<RailLinkView {...props} active={false} />}>
      <RailLinkActive {...props} />
    </Suspense>
  );
}
