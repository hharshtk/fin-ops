import Link from "next/link";
import { Suspense } from "react";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SampleAction } from "@/components/ui/sample-action";
import { Segmented } from "@/components/ui/segmented";
import { Table, Td, Th, TotalRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import type { InvoiceStatus } from "@/domain/types";
import { getClients, getInvoices, getUnbilled } from "@/data/queries";
import { BillingPanel } from "@/features/billing/panel";
import { InvoiceTable } from "@/features/billing/invoice-table";
import { amount, daysBetween, inrShort } from "@/lib/format";
import { byCode, shortName } from "@/lib/names";
import { TODAY } from "@/lib/today";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Billing" };

const STATUSES: InvoiceStatus[] = [
  "Overdue",
  "Sent",
  "Part paid",
  "Paid",
  "Draft",
];
const BUCKETS = [
  { label: "Not due", min: -Infinity, max: 0 },
  { label: "1–30", min: 1, max: 30 },
  { label: "31–60", min: 31, max: 60 },
  { label: "61–90", min: 61, max: 90 },
  { label: "90+", min: 91, max: Infinity },
];

export default function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Billing" />
          <TableSkeleton rows={14} cols={9} />
        </>
      }
    >
      <Billing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Billing({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const tab = param(sp, "tab") ?? "invoices";
  const statusKey = param(sp, "status");
  const selParam = param(sp, "sel");
  const [invoices, clientList, unbilled] = await Promise.all([
    getInvoices(),
    getClients(),
    getUnbilled(),
  ]);
  const clients = byCode(clientList);
  const path = "/billing";

  const status = STATUSES.find(
    (s) => s.toLowerCase().replace(" ", "-") === statusKey,
  );
  const rows = (status ? invoices.filter((i) => i.status === status) : invoices)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const billed = invoices
    .filter((i) => i.status !== "Draft")
    .reduce((s, i) => s + i.total, 0);
  const collected = invoices.reduce((s, i) => s + i.received, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "Draft")
    .reduce((s, i) => s + i.total - i.received, 0);
  const over60 = invoices
    .filter(
      (i) =>
        i.status !== "Draft" &&
        i.total > i.received &&
        daysBetween(i.due, TODAY) > 60,
    )
    .reduce((s, i) => s + i.total - i.received, 0);
  const unbilledValue = unbilled.reduce((s, u) => s + u.value, 0);

  const ageing = new Map<string, number[]>();
  for (const inv of invoices) {
    const bal = inv.total - inv.received;
    if (bal <= 0 || inv.status === "Draft") continue;
    const age = daysBetween(inv.due, TODAY);
    const idx = BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
    const row = ageing.get(inv.clientCode) ?? BUCKETS.map(() => 0);
    row[idx] = (row[idx] ?? 0) + bal;
    ageing.set(inv.clientCode, row);
  }
  const ageingRows = [...ageing.entries()].sort(
    (a, b) => b[1].reduce((s, x) => s + x, 0) - a[1].reduce((s, x) => s + x, 0),
  );
  const bucketTotals = BUCKETS.map((_, i) =>
    ageingRows.reduce((s, [, r]) => s + (r[i] ?? 0), 0),
  );

  const selectedId =
    inspectId ??
    (invoices.some((i) => i.id === selParam) ? selParam : undefined);
  const shownId = selectedId ?? (tab === "invoices" ? rows[0]?.id : undefined);

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Billing"
          meta="FY 2026-27"
          actions={
            <SampleAction variant="primary" done="Invoice drafted (sample)">
              New invoice
            </SampleAction>
          }
        />
        <div className="scroll-thin overflow-x-auto border-b border-line bg-surface">
          <ul className="flex min-w-max divide-x divide-line">
            {[
              ["billed this FY", inrShort(billed), false],
              ["collected", inrShort(collected), false],
              ["outstanding", inrShort(outstanding), false],
              ["over 60 days", inrShort(over60), true],
              ["unbilled work", inrShort(unbilledValue), false],
            ].map(([label, value, red]) => (
              <li
                key={label as string}
                className="flex h-11 items-center gap-2 px-4"
              >
                <span
                  className={
                    red
                      ? "text-lg font-bold text-sig-red-ink condensed tabular-nums"
                      : "text-lg font-bold condensed tabular-nums"
                  }
                >
                  {value}
                </span>
                <span className="text-sm text-ink-2">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Billing"
            items={[
              {
                label: "Invoices",
                href: hrefWith(path, sp, { tab: null }),
                active: tab === "invoices",
                count: invoices.length,
              },
              {
                label: "Receivables",
                href: hrefWith(path, sp, { tab: "receivables", status: null }),
                active: tab === "receivables",
                count: ageingRows.length,
              },
              {
                label: "Unbilled",
                href: hrefWith(path, sp, { tab: "unbilled", status: null }),
                active: tab === "unbilled",
                count: unbilled.length,
              },
            ]}
          />
        </div>

        {tab === "invoices" && (
          <>
            <Toolbar>
              <Segmented
                label="Invoice status"
                items={[
                  {
                    label: "All",
                    href: hrefWith(path, sp, { status: null }),
                    active: !status,
                  },
                  ...STATUSES.map((s) => ({
                    label: s,
                    href: hrefWith(path, sp, {
                      status: s.toLowerCase().replace(" ", "-"),
                    }),
                    active: status === s,
                  })),
                ]}
                className="max-w-full overflow-x-auto"
              />
            </Toolbar>
            {rows.length ? (
              <InvoiceTable
                invoices={rows}
                clients={clients}
                selected={shownId}
                hrefFor={(id) => inspectHref(path, id, sp)}
              />
            ) : (
              <Empty title="No invoices with this status" />
            )}
          </>
        )}

        {tab === "receivables" && (
          <div className="scroll-thin overflow-x-auto">
            <Table label="Receivables by age" className="min-w-[48rem]">
              <thead>
                <tr>
                  <Th>Client</Th>
                  {BUCKETS.map((b) => (
                    <Th key={b.label} align="right" width="7.5rem">
                      {b.label === "Not due" ? b.label : `${b.label} days`}
                    </Th>
                  ))}
                  <Th align="right" width="8rem">
                    Total
                  </Th>
                </tr>
              </thead>
              <tbody>
                {ageingRows.map(([code, r]) => (
                  <tr key={code} className="row">
                    <Td>
                      <Link
                        href={`/clients/${code}?tab=billing`}
                        className="hover:underline"
                      >
                        <span className="mr-2 text-xs ident text-ink-3">
                          {code}
                        </span>
                        {clients[code] ? shortName(clients[code]!.name) : code}
                      </Link>
                    </Td>
                    {r.map((v, i) => (
                      <Td
                        key={i}
                        align="right"
                        className={
                          v && i >= 3
                            ? "font-semibold text-sig-red-ink"
                            : v
                              ? ""
                              : "text-ink-4"
                        }
                      >
                        {v ? amount(v) : "·"}
                      </Td>
                    ))}
                    <Td align="right" className="font-semibold">
                      {amount(r.reduce((s, x) => s + x, 0))}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <TotalRow>
                  <td className="h-8 px-3 text-sm">Total</td>
                  {bucketTotals.map((t, i) => (
                    <td key={i} className="px-2 text-right text-sm figures">
                      {amount(t)}
                    </td>
                  ))}
                  <td className="px-3 text-right text-sm figures">
                    {amount(bucketTotals.reduce((s, x) => s + x, 0))}
                  </td>
                </TotalRow>
              </tfoot>
            </Table>
          </div>
        )}

        {tab === "unbilled" && (
          <div className="scroll-thin overflow-x-auto">
            <Table label="Unbilled work" className="min-w-[44rem]">
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Work</Th>
                  <Th align="right" width="5rem">
                    Hours
                  </Th>
                  <Th align="right" width="8rem">
                    Value
                  </Th>
                  <Th width="9rem">
                    <span className="sr-only">Action</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {unbilled.map((u) => (
                  <tr key={u.clientCode + u.work} className="row">
                    <Td className="max-w-[14rem] truncate">
                      <span className="mr-2 text-xs ident text-ink-3">
                        {u.clientCode}
                      </span>
                      {clients[u.clientCode]
                        ? shortName(clients[u.clientCode]!.name)
                        : ""}
                    </Td>
                    <Td className="text-ink-2">{u.work}</Td>
                    <Td align="right">{u.hours}</Td>
                    <Td align="right">{amount(u.value)}</Td>
                    <Td className="py-0.5">
                      <SampleAction done="Invoice drafted" className="h-6">
                        Raise invoice
                      </SampleAction>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
      {tab === "invoices" && !inspectId && (
        <DefaultPanelGate>
          <BillingPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
