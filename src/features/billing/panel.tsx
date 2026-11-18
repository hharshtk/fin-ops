import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import { getClients, getInvoices } from "@/data/queries";
import { byCode } from "@/lib/names";
import { hrefWith, type SearchParams } from "@/lib/url";
import { InvoiceInspector } from "./invoice-inspector";

/** The Billing inspector for one invoice, as the list's default or as an explicit selection. */
export async function BillingPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [invoices, clientList] = await Promise.all([
    getInvoices(),
    getClients(),
  ]);
  const invoice = id ? invoices.find((i) => i.id === id) : undefined;
  return (
    <Inspector
      label="Invoice"
      explicit={explicit}
      closeHref={explicit ? hrefWith("/billing", sp, { sel: null }) : undefined}
    >
      {invoice ? (
        <InvoiceInspector
          invoice={invoice}
          client={byCode(clientList)[invoice.clientCode]}
        />
      ) : (
        <Empty title={id ? "Invoice not found" : "Nothing selected"} />
      )}
    </Inspector>
  );
}
