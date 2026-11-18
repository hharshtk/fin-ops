import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import { getClients, getFilings, getInvoices, getStaff } from "@/data/queries";
import { byId } from "@/lib/names";
import { hrefWith, type SearchParams } from "@/lib/url";
import { ClientInspector } from "./client-inspector";
import { buildClientRows } from "./rows";

/** The Clients inspector for one client, as the list's default or as an explicit selection. */
export async function ClientsPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [clients, filings, invoices, staffList] = await Promise.all([
    getClients(),
    getFilings(),
    getInvoices(),
    getStaff(),
  ]);
  const client = id ? clients.find((c) => c.code === id) : undefined;
  const row = client
    ? buildClientRows([client], filings, invoices)[0]
    : undefined;
  return (
    <Inspector
      label="Client"
      explicit={explicit}
      closeHref={explicit ? hrefWith("/clients", sp, { sel: null }) : undefined}
    >
      {row ? (
        <ClientInspector
          client={row.client}
          aspect={row.aspect}
          filings={filings.filter((f) => f.clientCode === row.client.code)}
          outstanding={row.outstanding}
          staff={byId(staffList)}
        />
      ) : (
        <Empty title={id ? "Client not found" : "Select a client"}>
          The book shows every client at once, worst signal first. Pick one to
          see filings, fees and contacts.
        </Empty>
      )}
    </Inspector>
  );
}
