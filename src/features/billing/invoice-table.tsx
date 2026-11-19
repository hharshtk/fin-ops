import type { ReactNode } from "react";
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
  // Columns drop by the table's own width (a container query). On a narrow table the invoice
  // number column goes and the row link moves to the client, keeping the number for screen readers.
  const num = showClient ? "@max-[36rem]:hidden" : "";
  const services = "@max-[84rem]:hidden";
  const tax = "@max-[70rem]:hidden";
  const date = "@max-[44rem]:hidden";
  const received = "@max-[48rem]:hidden";
  const due = "@max-[40rem]:hidden";
  const label = `Total, ${invoices.length} invoices`;
  return (
    <div className="@container scroll-thin overflow-x-auto">
      <Table label="Invoices">
        <thead>
          <tr>
            <Th width="9.5rem" className={num}>
              Invoice
            </Th>
            <Th width="4.5rem" className={date}>
              Date
            </Th>
            {showClient && <Th>Client</Th>}
            <Th className={services}>Services</Th>
            <Th width="7.5rem" align="right" className={tax}>
              Taxable
            </Th>
            <Th width="6.5rem" align="right" className={tax}>
              GST 18%
            </Th>
            <Th width="7.5rem" align="right">
              Total
            </Th>
            <Th width="7.5rem" align="right" className={received}>
              Received
            </Th>
            <Th width="4.5rem" align="right" className={due}>
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
            const link = (children: ReactNode, className?: string) => (
              <RowLink
                href={hrefFor(inv.id)}
                selected={inv.id === selected}
                className={className}
              >
                {children}
              </RowLink>
            );
            return (
              <Tr key={inv.id}>
                <Td className={num}>
                  {showClient ? (
                    <span className="font-medium ident">{inv.number}</span>
                  ) : (
                    link(inv.number, "font-medium ident")
                  )}
                </Td>
                <Td className={`text-ink-2 figures ${date}`}>
                  {dayMonth(inv.date)}
                </Td>
                {showClient && (
                  <Td className="w-full max-w-0">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 text-xs ident text-ink-3 @max-[30rem]:hidden">
                        {inv.clientCode}
                      </span>
                      {link(
                        <>
                          <span className="sr-only">{inv.number}, </span>
                          {c ? shortName(c.name) : inv.clientCode}
                        </>,
                        "truncate",
                      )}
                    </div>
                  </Td>
                )}
                <Td className={`max-w-[16rem] truncate text-ink-2 ${services}`}>
                  {inv.lines.map((l) => l.description).join("; ")}
                </Td>
                <Td align="right" className={tax}>
                  {amount(inv.taxable)}
                </Td>
                <Td align="right" className={`text-ink-2 ${tax}`}>
                  {amount(inv.gst)}
                </Td>
                <Td align="right" className="font-medium">
                  {amount(inv.total)}
                </Td>
                <Td align="right" className={`text-ink-2 ${received}`}>
                  {inv.received ? (
                    amount(inv.received)
                  ) : (
                    <span className="text-ink-4">·</span>
                  )}
                </Td>
                <Td
                  align="right"
                  className={`${late ? "font-medium text-sig-red-ink" : "text-ink-2"} ${due}`}
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
            <td className={`h-8 px-3 text-sm whitespace-nowrap ${num}`}>
              {label}
            </td>
            <td className={date} />
            {showClient && (
              <td className="px-2 text-sm whitespace-nowrap">
                <span className="@min-[36rem]:hidden">{label}</span>
              </td>
            )}
            <td className={services} />
            <td className={`px-2 text-right text-sm figures ${tax}`}>
              {amount(totals.taxable)}
            </td>
            <td className={`px-2 text-right text-sm figures ${tax}`}>
              {amount(totals.gst)}
            </td>
            <td className="px-2 text-right text-sm figures">
              {amount(totals.total)}
            </td>
            <td className={`px-2 text-right text-sm figures ${received}`}>
              {amount(totals.received)}
            </td>
            <td className={due} />
            <td />
          </TotalRow>
        </tfoot>
      </Table>
    </div>
  );
}
