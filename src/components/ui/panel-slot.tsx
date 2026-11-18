import { Suspense, type ReactNode } from "react";
import type { SearchParams } from "@/lib/url";
import { Inspector, InspectorSkeleton } from "./inspector";

/**
 * Body of a module's `@panel/inspect/[id]` route: resolves the selected id and the list's filters,
 * then renders the module's panel.
 *
 * The Suspense boundary sits inside the row's own segment, as Next's instant-navigation model
 * requires for moves between rows. A row that was prefetched (hover, focus, touch, or a neighbour
 * of the selection) renders straight from memory; otherwise an explicit inspector skeleton holds
 * the column while the panel streams in.
 */
export function PanelSlot({
  label,
  params,
  searchParams,
  children,
}: {
  label: string;
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
  children: (id: string, sp: SearchParams) => ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Inspector label={label} explicit>
          <InspectorSkeleton />
        </Inspector>
      }
    >
      <Resolve params={params} searchParams={searchParams} render={children} />
    </Suspense>
  );
}

async function Resolve({
  params,
  searchParams,
  render,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
  render: (id: string, sp: SearchParams) => ReactNode;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return render(decodeURIComponent(id), sp);
}
