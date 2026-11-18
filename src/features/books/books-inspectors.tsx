import { Check, Paperclip, TriangleAlert } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import type { BankLine, Voucher } from "@/domain/types";
import { amount, date } from "@/lib/format";

export function VoucherInspector({ voucher: v }: { voucher: Voucher }) {
  const dr = v.entries.reduce((s, e) => s + (e.dr ?? 0), 0);
  const cr = v.entries.reduce((s, e) => s + (e.cr ?? 0), 0);
  return (
    <>
      <InspectorHead
        title={<span className="ident">{v.number}</span>}
        meta={
          <>
            {v.type} · {date(v.date)} · {v.party}
          </>
        }
      />
      <InspectorActions>
        <SampleAction variant="primary" done="Opened for editing (sample)">
          Edit voucher
        </SampleAction>
        {!v.attachment && (
          <SampleAction done="Upload dialog (sample)">
            <Paperclip />
            Attach bill
          </SampleAction>
        )}
      </InspectorActions>
      {!v.attachment && (
        <div className="flex items-start gap-2 border-b border-line bg-sig-yellow-wash px-4 py-2.5 text-sm">
          <TriangleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-sig-yellow-ink"
          />
          <p>
            No supporting document. Auditors will ask for one; request it from
            the client.
          </p>
        </div>
      )}
      <InspectorSection title="Entries">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-3">
              <th className="pb-1 text-left caps">Ledger</th>
              <th className="pb-1 text-right caps">Debit</th>
              <th className="pb-1 text-right caps">Credit</th>
            </tr>
          </thead>
          <tbody>
            {v.entries.map((e) => (
              <tr key={e.ledger + (e.dr ?? e.cr)}>
                <td className={e.cr ? "py-1 pl-4" : "py-1"}>{e.ledger}</td>
                <td className="py-1 text-right figures">
                  {e.dr ? amount(e.dr) : ""}
                </td>
                <td className="py-1 text-right figures">
                  {e.cr ? amount(e.cr) : ""}
                </td>
              </tr>
            ))}
            <tr className="border-t border-line-strong font-semibold">
              <td className="pt-1.5">Total</td>
              <td className="pt-1.5 text-right figures">{amount(dr)}</td>
              <td className="pt-1.5 text-right figures">{amount(cr)}</td>
            </tr>
          </tbody>
        </table>
      </InspectorSection>
      <InspectorSection title="Detail">
        <Facts
          items={[
            ["Narration", v.narration],
            ...(v.gst
              ? ([
                  [
                    "CGST",
                    <span key="c" className="figures">
                      {amount(v.gst.cgst)}
                    </span>,
                  ],
                  [
                    "SGST",
                    <span key="s" className="figures">
                      {amount(v.gst.sgst)}
                    </span>,
                  ],
                  [
                    "IGST",
                    <span key="i" className="figures">
                      {amount(v.gst.igst)}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ["Document", v.attachment ? "Attached" : "Missing"],
          ]}
        />
      </InspectorSection>
    </>
  );
}

export function BankLineInspector({
  line: b,
  voucher,
}: {
  line: BankLine;
  voucher?: Voucher;
}) {
  const value = b.credit ?? b.debit ?? 0;
  return (
    <>
      <InspectorHead
        title={<span className="text-base ident">{b.description}</span>}
        meta={
          <>
            {date(b.date)} · {b.credit ? "Deposit" : "Withdrawal"}{" "}
            <span className="figures">{amount(value)}</span>
          </>
        }
      />
      {b.match === "Matched" && (
        <InspectorSection title="Matched to">
          <p className="flex items-center gap-2 text-sm">
            <Check aria-hidden className="size-4 text-sig-green-ink" />
            <span className="ident">{b.voucherNo}</span>
            {voucher && <span className="text-ink-2">· {voucher.party}</span>}
          </p>
        </InspectorSection>
      )}
      {b.match === "Suggested" && (
        <>
          <InspectorSection title="Suggested match">
            <div className="border border-line px-3 py-2 text-sm">
              <p className="font-medium ident">{b.voucherNo}</p>
              {voucher && (
                <p className="text-ink-2">
                  {voucher.party} · {date(voucher.date)} ·{" "}
                  <span className="figures">{amount(voucher.amount)}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-ink-3">
                Party name in the narration matches; amount is a part payment
                against this invoice.
              </p>
            </div>
          </InspectorSection>
          <InspectorActions>
            <SampleAction variant="primary" done="Match accepted (sample)">
              Accept match
            </SampleAction>
            <SampleAction done="Suggestion dismissed">
              Not this one
            </SampleAction>
          </InspectorActions>
        </>
      )}
      {b.match === "Unmatched" && (
        <InspectorSection title="Create voucher">
          <div className="flex flex-col gap-3">
            <Field label="Voucher type" htmlFor={`${b.id}-type`}>
              <Select
                id={`${b.id}-type`}
                defaultValue={b.credit ? "Receipt" : "Payment"}
              >
                <option>Receipt</option>
                <option>Payment</option>
                <option>Journal</option>
              </Select>
            </Field>
            <Field
              label="Ledger"
              htmlFor={`${b.id}-ledger`}
              hint="Ask the client if unsure; the line stays unmatched until booked."
            >
              <Select id={`${b.id}-ledger`} defaultValue="">
                <option value="" disabled>
                  Choose a ledger
                </option>
                <option>Interest income</option>
                <option>Insurance expense</option>
                <option>Suspense</option>
                <option>Sundry debtors</option>
              </Select>
            </Field>
            <Field label="Narration" htmlFor={`${b.id}-narr`}>
              <Input id={`${b.id}-narr`} defaultValue={b.description} />
            </Field>
            <div className="flex gap-2">
              <SampleAction variant="primary" done="Voucher created (sample)">
                Create and match
              </SampleAction>
              <SampleAction done="Query sent to client">
                Ask client
              </SampleAction>
            </div>
          </div>
        </InspectorSection>
      )}
      <InspectorSection title="Line">
        <Facts
          items={[
            [
              "Reference",
              <span key="r" className="ident">
                {b.ref}
              </span>,
            ],
            [
              "Balance after",
              <span key="b" className="figures">
                {amount(b.balance)}
              </span>,
            ],
            ["Status", b.match],
          ]}
        />
      </InspectorSection>
    </>
  );
}
