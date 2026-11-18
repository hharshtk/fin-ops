export type SearchParams = Record<string, string | string[] | undefined>;

/** First value of a search param. */
export function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Build an href from the current params with some keys changed. `null` removes a key. Selection
 * (`sel`) is dropped whenever another key changes, unless the patch sets it.
 */
export function hrefWith(
  pathname: string,
  current: SearchParams,
  patch: Record<string, string | null | undefined>,
): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined) next.set(k, value);
  }
  if (!("sel" in patch)) next.delete("sel");
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Href that selects a row inside a module: `/compliance/inspect/<id>?<current filters>`. Within the
 * module this route is intercepted, so only the inspector panel is fetched and rendered; loaded
 * directly, it renders the whole page with that row selected. `base` is the module path ("" for
 * the Cockpit).
 */
export function inspectHref(
  base: string,
  id: string,
  current: SearchParams,
): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value !== undefined && k !== "sel") next.set(k, value);
  }
  const qs = next.toString();
  return `${base}/inspect/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;
}

/** The module's list path for a pathname that may end in `/inspect/<id>`. */
export function listPath(pathname: string): string {
  return pathname.replace(/\/inspect\/[^/]+\/?$/, "") || "/";
}
