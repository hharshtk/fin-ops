import { Status } from "@/components/ui/status";
import { RowLink, Table, Td, Th, TotalRow, Tr } from "@/components/ui/table";
import type { Client, Invoice } from "@/domain/types";
import { amount, daysBetween, dayMonth } from "@/lib/format";
import { shortName } from "@/lib/names";
import { TODAY } from "@/lib/today";

export function InvoiceTable({
  invoices,
  clients,
  selected,
  hrefFor,
  showClient = true,
}: {
  invoices: Invoice[];
  clients: Record<string, Client>;
  selected?: string;
  hrefFor: (id: string) => string;
  showClient?: boolean;
}) {
  const totals = invoices.reduce(
    (s, i) => ({
      taxable: s.taxable + i.taxable,
      gst: s.gst + i.gst,
      total: s.total + i.total,
      received: s.received + i.received,
    }),
    { taxable: 0, gst: 0, total: 0, received: 0 },
  );
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Invoices" className="min-w-[52rem]">
        <thead>
          <tr>
            <Th width="9.5rem">Invoice</Th>
            <Th width="4.5rem">Date</Th>
            {showClient && <Th>Client</Th>}
            <Th className="max-2xl:hidden">Services</Th>
            <Th width="7.5rem" align="right" className="max-2xl:hidden">
              Taxable
            </Th>
            <Th width="6.5rem" align="right" className="max-2xl:hidden">
              GST 18%
            </Th>
            <Th width="7.5rem" align="right">
              Total
            </Th>
            <Th width="7.5rem" align="right">
              Received
            </Th>
            <Th width="4.5rem" align="right">
              Due
            </Th>
            <Th width="7rem">Status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const c = clients[inv.clientCode];
            const late =
              inv.status === "Overdue" ? daysBetween(inv.due, TODAY) : 0;
            return (
              <Tr key={inv.id}>
                <Td>
                  <RowLink
                    href={hrefFor(inv.id)}
                    selected={inv.id === selected}
                    className="font-medium ident"
                  >
                    {inv.number}
                  </RowLink>
                </Td>
                <Td className="text-ink-2 figures">{dayMonth(inv.date)}</Td>
                {showClient && (
                  <Td className="max-w-[14rem] truncate">
                    <span className="mr-2 text-xs ident text-ink-3">
                      {inv.clientCode}
                    </span>
                    {c ? shortName(c.name) : ""}
                  </Td>
                )}
                <Td className="max-w-[16rem] truncate text-ink-2 max-2xl:hidden">
                  {inv.lines.map((l) => l.description).join("; ")}
                </Td>
                <Td align="right" className="max-2xl:hidden">
                  {amount(inv.taxable)}
                </Td>
                <Td align="right" className="text-ink-2 max-2xl:hidden">
                  {amount(inv.gst)}
                </Td>
                <Td align="right" className="font-medium">
                  {amount(inv.total)}
                </Td>
                <Td align="right" className="text-ink-2">
                  {inv.received ? (
                    amount(inv.received)
                  ) : (
                    <span className="text-ink-4">·</span>
                  )}
                </Td>
                <Td
                  align="right"
                  className={
                    late ? "font-medium text-sig-red-ink" : "text-ink-2"
                  }
                >
                  {late ? `${late}d late` : dayMonth(inv.due)}
                </Td>
                <Td>
                  <Status kind="invoice" value={inv.status} />
                </Td>
              </Tr>
            );
          })}
        </tbody>
        <tfoot>
          <TotalRow>
            <td className="h-8 px-3 text-sm" colSpan={showClient ? 3 : 2}>
              Total, {invoices.length} invoices
            </td>
            <td className="max-2xl:hidden" />
            <td className="px-2 text-right text-sm figures max-2xl:hidden">
              {amount(totals.taxable)}
            </td>
            <td className="px-2 text-right text-sm figures max-2xl:hidden">
              {amount(totals.gst)}
            </td>
            <td className="px-2 text-right text-sm figures">
              {amount(totals.total)}
            </td>
            <td className="px-2 text-right text-sm figures">
              {amount(totals.received)}
            </td>
            <td colSpan={2} />
          </TotalRow>
        </tfoot>
      </Table>
    </div>
  );
}
