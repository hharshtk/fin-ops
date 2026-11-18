import { Download, MessageCircle } from "lucide-react";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import { Status } from "@/components/ui/status";
import type { Client, Invoice } from "@/domain/types";
import { amount, date, daysBetween } from "@/lib/format";
import { TODAY } from "@/lib/today";

export function InvoiceInspector({
  invoice: inv,
  client,
}: {
  invoice: Invoice;
  client?: Client;
}) {
  const balance = inv.total - inv.received;
  const late = inv.status === "Overdue" ? daysBetween(inv.due, TODAY) : 0;
  const half = inv.gst / 2;
  return (
    <>
      <InspectorHead
        title={<span className="ident">{inv.number}</span>}
        meta={
          <>
            {client?.name ?? inv.clientCode} ·{" "}
            <Status kind="invoice" value={inv.status} />
          </>
        }
      />
      <InspectorActions>
        {balance > 0 && inv.status !== "Draft" && (
          <SampleAction variant="primary" done="Reminder queued">
            <MessageCircle />
            Payment reminder
          </SampleAction>
        )}
        {inv.status === "Draft" && (
          <SampleAction variant="primary" done="Sent to client (sample)">
            Send invoice
          </SampleAction>
        )}
        {balance > 0 && inv.status !== "Draft" && (
          <SampleAction done="Payment recorded (sample)">
            Record payment
          </SampleAction>
        )}
        <SampleAction variant="ghost" done="Downloaded (sample)">
          <Download />
          PDF
        </SampleAction>
      </InspectorActions>
      <InspectorSection title="Invoice">
        <Facts
          items={[
            ["Date", date(inv.date)],
            [
              "Due",
              late ? (
                <span key="d" className="text-sig-red-ink">
                  {date(inv.due)} · {late} days late
                </span>
              ) : (
                date(inv.due)
              ),
            ],
            [
              "Client GSTIN",
              <span key="g" className="ident">
                {client?.gstin ?? "Unregistered"}
              </span>,
            ],
            ["Place of supply", "27 Maharashtra"],
          ]}
        />
      </InspectorSection>
      <InspectorSection title="Lines">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-3">
              <th className="pb-1 text-left caps">Service</th>
              <th className="pb-1 text-right caps">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.description}>
                <td className="py-1 pr-3">
                  {l.description}
                  <span className="block text-xs ident text-ink-3">
                    SAC {l.sac}
                  </span>
                </td>
                <td className="py-1 text-right align-top figures">
                  {amount(l.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-line">
              <td className="pt-1.5 text-ink-2">Taxable value</td>
              <td className="pt-1.5 text-right figures">
                {amount(inv.taxable)}
              </td>
            </tr>
            <tr>
              <td className="text-ink-2">CGST 9%</td>
              <td className="text-right figures">{amount(half)}</td>
            </tr>
            <tr>
              <td className="text-ink-2">SGST 9%</td>
              <td className="text-right figures">{amount(half)}</td>
            </tr>
            <tr className="border-t border-line-strong font-semibold">
              <td className="pt-1.5">Total</td>
              <td className="pt-1.5 text-right figures">{amount(inv.total)}</td>
            </tr>
            <tr>
              <td className="text-ink-2">Received</td>
              <td className="text-right text-ink-2 figures">
                {amount(inv.received)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td>Balance</td>
              <td
                className={
                  balance > 0 && late
                    ? "text-right text-sig-red-ink figures"
                    : "text-right figures"
                }
              >
                {amount(balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </InspectorSection>
    </>
  );
}
