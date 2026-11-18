import { ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SampleAction } from "@/components/ui/sample-action";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import type { VoucherType } from "@/domain/types";
import { getBooks, getBooksClients, getClient } from "@/data/queries";
import { BooksPanel } from "@/features/books/panel";
import {
  BankStatement,
  DayBook,
  TrialBalance,
} from "@/features/books/books-views";
import { amount } from "@/lib/format";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Books" };

const TYPES: VoucherType[] = [
  "Sales",
  "Purchase",
  "Payment",
  "Receipt",
  "Journal",
  "Contra",
];

export default function BooksPage({
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
          <PageHeader title="Books" />
          <TableSkeleton rows={14} cols={7} />
        </>
      }
    >
      <Books params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Books({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const available = await getBooksClients();
  const code = param(sp, "client") ?? available[0]!;
  const tab = param(sp, "tab") ?? "daybook";
  const type = param(sp, "type");
  const selParam = param(sp, "sel");
  const [client, books] = await Promise.all([getClient(code), getBooks(code)]);
  const path = "/books";

  if (!client || !books) {
    return (
      <>
        <PageHeader title="Books" />
        <Empty
          title="Books are not kept in Fin Ops for this client"
          action={
            <ButtonLink href={path} variant="secondary">
              Open Mehta Textiles books
            </ButtonLink>
          }
        >
          In this sample, bookkeeping is populated for Mehta Textiles Pvt Ltd
          (MEH-014).
        </Empty>
      </>
    );
  }

  const vouchers = type
    ? books.vouchers.filter((v) => v.type === type)
    : books.vouchers;
  const matched = books.bankLines.filter((b) => b.match === "Matched").length;
  const suggested = books.bankLines.filter(
    (b) => b.match === "Suggested",
  ).length;
  const unmatched = books.bankLines.filter(
    (b) => b.match === "Unmatched",
  ).length;
  const closing = books.bankLines.at(-1)?.balance ?? books.bankOpening;
  const missingDocs = books.vouchers.filter((v) => !v.attachment).length;

  const selectable =
    tab === "daybook" ? books.vouchers : tab === "bank" ? books.bankLines : [];
  const selectedId =
    inspectId ??
    (selectable.some((x) => x.id === selParam) ? selParam : undefined);
  const shownId =
    selectedId ??
    (tab === "daybook"
      ? vouchers[0]?.id
      : tab === "bank"
        ? books.bankLines.find((b) => b.match !== "Matched")?.id
        : undefined);
  const hrefFor = (id: string) => inspectHref(path, id, sp);

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Books"
          meta={
            <span className="flex flex-wrap items-center gap-x-2">
              <Link
                href={`/clients/${client.code}`}
                className="text-ink hover:underline"
              >
                <span className="ident text-ink-3">{client.code}</span>{" "}
                {client.name}
              </Link>
              <span>· {books.period} · period open</span>
            </span>
          }
          actions={
            <>
              <SampleAction done="Oct 2026 locked (sample)">
                <Lock />
                Lock Oct
              </SampleAction>
              <ButtonLink
                href={`/clients/${client.code}?tab=books`}
                variant="ghost"
              >
                Client
                <ArrowUpRight />
              </ButtonLink>
            </>
          }
        />
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Books"
            items={[
              {
                label: "Day book",
                href: hrefWith(path, sp, { tab: null, type: null }),
                active: tab === "daybook",
                count: books.vouchers.length,
              },
              {
                label: "Bank reconciliation",
                href: hrefWith(path, sp, { tab: "bank", type: null }),
                active: tab === "bank",
                count: suggested + unmatched,
              },
              {
                label: "Trial balance",
                href: hrefWith(path, sp, { tab: "tb", type: null }),
                active: tab === "tb",
              },
            ]}
          />
        </div>

        {tab === "daybook" && (
          <>
            <Toolbar>
              <Segmented
                label="Voucher type"
                items={[
                  {
                    label: "All",
                    href: hrefWith(path, sp, { type: null }),
                    active: !type,
                  },
                  ...TYPES.map((t) => ({
                    label: t,
                    href: hrefWith(path, sp, { type: t }),
                    active: type === t,
                  })),
                ]}
                className="max-w-full overflow-x-auto"
              />
              <span className="text-sm text-ink-3 sm:ml-auto">
                Sample excerpt of Oct 2026 · {missingDocs} without a document
              </span>
            </Toolbar>
            <DayBook vouchers={vouchers} selected={shownId} hrefFor={hrefFor} />
          </>
        )}

        {tab === "bank" && (
          <>
            <div className="scroll-thin overflow-x-auto border-b border-line bg-surface">
              <ul className="flex min-w-max divide-x divide-line text-sm">
                <li className="flex h-11 items-center gap-2 px-4 text-ink-2">
                  HDFC current account{" "}
                  <span className="ident text-ink">··2231</span>
                </li>
                {[
                  ["closing as per bank", amount(closing)],
                  ["matched", String(matched)],
                  ["suggested", String(suggested)],
                  ["unmatched", String(unmatched)],
                ].map(([k, v]) => (
                  <li key={k} className="flex h-11 items-center gap-2 px-4">
                    <span
                      className={
                        k === "unmatched" && unmatched
                          ? "text-lg font-bold text-sig-yellow-ink condensed tabular-nums"
                          : "text-lg font-bold condensed tabular-nums"
                      }
                    >
                      {v}
                    </span>
                    <span className="text-ink-2">{k}</span>
                  </li>
                ))}
              </ul>
            </div>
            <BankStatement
              lines={books.bankLines}
              opening={books.bankOpening}
              selected={shownId}
              hrefFor={hrefFor}
            />
          </>
        )}

        {tab === "tb" && (
          <>
            <Toolbar>
              <span className="text-sm text-ink-2">
                As at 31/10/2026 · Apr to Oct, FY 2026-27 · provisional
              </span>
              <SampleAction className="sm:ml-auto" done="Exported (sample)">
                Export to Excel
              </SampleAction>
            </Toolbar>
            <TrialBalance rows={books.trialBalance} />
          </>
        )}
      </div>

      {tab !== "tb" && !inspectId && (
        <DefaultPanelGate>
          <BooksPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
