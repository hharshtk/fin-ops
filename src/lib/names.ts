import type { Client, StaffMember } from "@/domain/types";

/** Client name without the constitution suffix, for dense rows. */
export function shortName(name: string): string {
  return name
    .replace(/\s*\(OPC\)\s*Pvt Ltd$/, "")
    .replace(/\s+(Pvt Ltd|Ltd|LLP)$/, "")
    .replace(/\s*\(HUF\)$/, " HUF");
}

export function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((i) => [i.id, i]));
}

export function byCode(items: Client[]): Record<string, Client> {
  return Object.fromEntries(items.map((c) => [c.code, c]));
}

export function firstName(s: StaffMember | undefined): string {
  return s?.name.split(" ")[0] ?? "—";
}
