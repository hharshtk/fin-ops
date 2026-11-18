import type { Client, Filing, Invoice } from "@/domain/types";
import { aspectFor, worstAspect } from "@/lib/signal";
import { TODAY } from "@/lib/today";
import type { ClientRow } from "./client-views";

/** View model for client lists: each client's worst signal, open and overdue counts, fees due. */
export function buildClientRows(
  clients: Client[],
  filings: Filing[],
  invoices: Invoice[],
): ClientRow[] {
  return clients.map((client) => {
    const own = filings.filter(
      (f) => f.clientCode === client.code && f.status !== "Filed",
    );
    const outstanding = invoices
      .filter((i) => i.clientCode === client.code && i.status !== "Draft")
      .reduce((s, i) => s + (i.total - i.received), 0);
    return {
      client,
      aspect: own.length
        ? worstAspect(own.map((f) => aspectFor(f.due)))
        : "green",
      open: own.length,
      overdue: own.filter((f) => f.due < TODAY).length,
      outstanding,
    };
  });
}
