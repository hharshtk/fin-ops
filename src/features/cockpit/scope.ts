import type { Client, Filing, PracticeException } from "@/domain/types";
import { param, type SearchParams } from "@/lib/url";

export type Scope = "firm" | "mine";

export function scopeOf(sp: SearchParams): Scope {
  return param(sp, "scope") === "mine" ? "mine" : "firm";
}

/** "My clients and work": filings I prepare or review, or for clients where I am the partner. */
export function scopeFilings(
  filings: Filing[],
  clients: Record<string, Client>,
  meId: string,
  scope: Scope,
): Filing[] {
  if (scope === "firm") return filings;
  return filings.filter(
    (f) =>
      f.assigneeId === meId ||
      f.reviewerId === meId ||
      clients[f.clientCode]?.partnerId === meId,
  );
}

export function scopeExceptions(
  exceptions: PracticeException[],
  clients: Record<string, Client>,
  meId: string,
  scope: Scope,
): PracticeException[] {
  if (scope === "firm") return exceptions;
  return exceptions.filter(
    (x) => x.ownerId === meId || clients[x.clientCode]?.partnerId === meId,
  );
}
