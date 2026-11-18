import { Paperclip, TriangleAlert } from "lucide-react";
import { RowLink, Table, Td, Th, TotalRow, Tr } from "@/components/ui/table";
import type { BankLine, TrialBalanceRow, Voucher } from "@/domain/types";
import { cn } from "@/lib/cn";
import { amount, dayMonth, weekday } from "@/lib/format";

const TYPE_TONE: Record<Voucher["type"], string> = {
  Sales: "text-sig-green-ink",
  Purchase: "text-ink",
  Payment: "text-ink-2",
  Receipt: "text-ink-2",
  Journal: "text-navy",
  Contra: "text-ink-3",
};

export function DayBook({
  vouchers,
  selected,
  hrefFor,
}: {
  vouchers: Voucher[];
  selected?: string;
  hrefFor: (id: string) => string;
}) {
  const groups = new Map<string, Voucher[]>();
  for (const v of vouchers)
    groups.set(v.date, [...(groups.get(v.date) ?? []), v]);
  const total = vouchers.reduce((s, v) => s + v.amount, 0);
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Day book" className="min-w-[50rem]">
        <thead>
          <tr>
            <Th width="5.5rem">Date</Th>
            <Th width="9rem">Voucher</Th>
            <Th width="5.5rem">Type</Th>
            <Th width="11rem">Party / ledger</Th>
            <Th>Narration</Th>
            <Th width="7rem" align="right" className="max-2xl:hidden">
              GST
            </Th>
            <Th width="8.5rem" align="right">
              Amount
            </Th>
            <Th width="2rem" align="center">
              <span className="sr-only">Document</span>
            </Th>
          </tr>
        </thead>
        {[...groups.entries()].map(([d, rows]) => (
          <tbody key={d}>
            {rows.map((v, i) => {
              const gst = v.gst ? v.gst.cgst + v.gst.sgst + v.gst.igst : 0;
              return (
                <Tr key={v.id}>
                  <Td>
                    {i === 0 && (
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold condensed tabular-nums">
                          {dayMonth(d)}
                        </span>
                        <span className="text-xs text-ink-3">{weekday(d)}</span>
                      </span>
                    )}
                  </Td>
                  <Td>
                    <RowLink
                      href={hrefFor(v.id)}
                      selected={v.id === selected}
                      className="font-medium ident"
                    >
                      {v.number}
                    </RowLink>
                  </Td>
                  <Td className={TYPE_TONE[v.type]}>{v.type}</Td>
                  <Td className="max-w-[11rem] truncate">{v.party}</Td>
                  <Td className="w-full max-w-0 truncate text-ink-2">
                    {v.narration}
                  </Td>
                  <Td align="right" className="text-ink-2 max-2xl:hidden">
                    {gst ? amount(gst) : <span className="text-ink-4">·</span>}
                  </Td>
                  <Td align="right" className="font-medium">
                    {amount(v.amount)}
                  </Td>
                  <Td align="center">
                    {v.attachment ? (
                      <Paperclip
                        aria-label="Document attached"
                        className="mx-auto size-3.5 text-ink-4"
                      />
                    ) : (
                      <TriangleAlert
                        aria-label="No document attached"
                        className="mx-auto size-3.5 text-sig-yellow-ink"
                      />
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        ))}
        <tfoot>
          <TotalRow>
            <td colSpan={5} className="h-8 px-3 text-sm">
              {vouchers.length} vouchers
            </td>
            <td className="max-2xl:hidden" />
            <td className="px-2 text-right text-sm figures">{amount(total)}</td>
            <td />
          </TotalRow>
        </tfoot>
      </Table>
    </div>
  );
}

const MATCH_TONE: Record<BankLine["match"], string> = {
  Matched: "text-sig-green-ink",
  Suggested: "text-navy font-medium",
  Unmatched: "text-sig-yellow-ink font-medium",
};

export function BankStatement({
  lines,
  opening,
  selected,
  hrefFor,
}: {
  lines: BankLine[];
  opening: number;
  selected?: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Bank statement" className="min-w-[50rem]">
        <thead>
          <tr>
            <Th width="4rem">Date</Th>
            <Th>Description</Th>
            <Th width="9rem" className="max-2xl:hidden">
              Reference
            </Th>
            <Th width="7rem" align="right">
              Withdrawal
            </Th>
            <Th width="7rem" align="right">
              Deposit
            </Th>
            <Th width="7.5rem" align="right">
              Balance
            </Th>
            <Th width="5.75rem">Match</Th>
            <Th width="7.5rem">Voucher</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="h-7 border-b border-line px-3 text-sm text-ink-3"
              colSpan={4}
            >
              Opening balance, 01/10/2026
            </td>
            <td className="h-7 border-b border-line max-2xl:hidden" />
            <td className="h-7 border-b border-line px-2 text-right text-sm text-ink-2 figures">
              {amount(opening)}
            </td>
            <td className="border-b border-line" colSpan={2} />
          </tr>
          {lines.map((b) => (
            <Tr key={b.id}>
              <Td className="text-ink-2 figures">{dayMonth(b.date)}</Td>
              <Td className="w-full max-w-0">
                <RowLink
                  href={hrefFor(b.id)}
                  selected={b.id === selected}
                  className="block truncate text-xs ident"
                >
                  {b.description}
                </RowLink>
              </Td>
              <Td className="text-xs ident text-ink-3 max-2xl:hidden">
                {b.ref}
              </Td>
              <Td align="right">{b.debit ? amount(b.debit) : ""}</Td>
              <Td align="right">{b.credit ? amount(b.credit) : ""}</Td>
              <Td align="right" className="text-ink-2">
                {amount(b.balance)}
              </Td>
              <Td className={MATCH_TONE[b.match]}>{b.match}</Td>
              <Td className="text-xs ident text-ink-2">
                {b.voucherNo ?? <span className="text-ink-4">—</span>}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export function TrialBalance({ rows }: { rows: TrialBalanceRow[] }) {
  const groups = new Map<string, TrialBalanceRow[]>();
  for (const r of rows)
    groups.set(r.group, [...(groups.get(r.group) ?? []), r]);
  const dr = rows.reduce((s, r) => s + (r.debit ?? 0), 0);
  const cr = rows.reduce((s, r) => s + (r.credit ?? 0), 0);
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Trial balance" className="min-w-[40rem]" rhythm>
        <thead>
          <tr>
            <Th>Ledger</Th>
            <Th width="11rem" align="right">
              Debit
            </Th>
            <Th width="11rem" align="right">
              Credit
            </Th>
          </tr>
        </thead>
        {[...groups.entries()].map(([g, items]) => {
          const gdr = items.reduce((s, r) => s + (r.debit ?? 0), 0);
          const gcr = items.reduce((s, r) => s + (r.credit ?? 0), 0);
          return (
            <tbody key={g}>
              <tr>
                <th
                  scope="rowgroup"
                  className="h-7 border-b border-line bg-surface px-3 text-left text-sm font-semibold"
                >
                  {g}
                </th>
                <td className="h-7 border-b border-line px-2 text-right text-sm font-semibold figures">
                  {gdr ? amount(gdr) : ""}
                </td>
                <td className="h-7 border-b border-line px-3 text-right text-sm font-semibold figures">
                  {gcr ? amount(gcr) : ""}
                </td>
              </tr>
              {items.map((r) => (
                <tr key={r.ledger}>
                  <Td className="pl-7 text-ink-2">{r.ledger}</Td>
                  <Td align="right">{r.debit ? amount(r.debit) : ""}</Td>
                  <Td align="right">{r.credit ? amount(r.credit) : ""}</Td>
                </tr>
              ))}
            </tbody>
          );
        })}
        <tfoot>
          <TotalRow>
            <td className="h-8 px-3 text-sm">Total</td>
            <td className="px-2 text-right text-sm figures">{amount(dr)}</td>
            <td className="px-3 text-right text-sm figures">{amount(cr)}</td>
          </TotalRow>
          <tr>
            <td className="h-7 px-3 text-sm text-ink-3">Difference</td>
            <td
              colSpan={2}
              className={cn(
                "px-3 text-right text-sm font-semibold figures",
                dr === cr ? "text-sig-green-ink" : "text-sig-red-ink",
              )}
            >
              {amount(Math.abs(dr - cr))}
            </td>
          </tr>
        </tfoot>
      </Table>
    </div>
  );
}
