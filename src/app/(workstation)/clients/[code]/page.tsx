import {
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  Plus,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { CopyText } from "@/components/ui/copy-text";
import { Facts } from "@/components/ui/inspector";
import { Empty, Skeleton, TableSkeleton } from "@/components/ui/misc";
import { Panel } from "@/components/ui/panel";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import { Tabs } from "@/components/ui/tabs";
import {
  filingActivity,
  getBooks,
  getClient,
  getDocuments,
  getExceptions,
  getFilings,
  getInvoices,
  getStaff,
  getTasks,
  getUnbilled,
} from "@/data/queries";
import { InvoiceTable } from "@/features/billing/invoice-table";
import { ContactBlock, regLabel } from "@/features/clients/client-inspector";
import { ComplianceMatrix } from "@/features/clients/compliance-matrix";
import { Register } from "@/features/compliance/register";
import { DocTable } from "@/features/documents/doc-table";
import { amount, date, dateTime, inr, inrShort } from "@/lib/format";
import { byCode, byId } from "@/lib/names";
import { aspectFor, worstAspect } from "@/lib/signal";
import { TODAY } from "@/lib/today";
import { param, type SearchParams } from "@/lib/url";

export async function generateMetadata({
  params,
}: PageProps<"/clients/[code]">) {
  const { code } = await params;
  const c = await getClient(code);
  return { title: c ? c.name : "Client" };
}

const TABS = [
  "overview",
  "compliance",
  "books",
  "documents",
  "billing",
  "activity",
] as const;
type Tab = (typeof TABS)[number];

export default function ClientPage({
  params,
  searchParams,
}: PageProps<"/clients/[code]">) {
  return (
    <Suspense
      fallback={
        <div className="bg-surface">
          <div className="flex h-24 flex-col justify-center gap-2 border-b border-line px-4">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-3 w-96" />
          </div>
          <TableSkeleton rows={10} cols={8} />
        </div>
      }
    >
      <ClientWorkspace params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ClientWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const client = await getClient(code);
  if (!client) notFound();
  const tabParam = param(sp, "tab");
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "overview";

  const [
    allFilings,
    staffList,
    tasks,
    docs,
    invoices,
    unbilled,
    exceptions,
    books,
  ] = await Promise.all([
    getFilings(),
    getStaff(),
    getTasks(),
    getDocuments(),
    getInvoices(),
    getUnbilled(),
    getExceptions(),
    getBooks(code),
  ]);
  const staff = byId(staffList);
  const filings = allFilings.filter((f) => f.clientCode === code);
  const open = filings
    .filter((f) => f.status !== "Filed")
    .sort((a, b) => a.due.localeCompare(b.due));
  const aspect = open.length
    ? worstAspect(open.map((f) => aspectFor(f.due)))
    : "green";
  const clientTasks = tasks
    .filter((t) => t.clientCode === code && t.status !== "Done")
    .sort((a, b) => a.due.localeCompare(b.due));
  const clientDocs = docs.filter((d) => d.clientCode === code);
  const clientInvoices = invoices.filter((i) => i.clientCode === code);
  const clientUnbilled = unbilled.filter((u) => u.clientCode === code);
  const clientExceptions = exceptions.filter((x) => x.clientCode === code);
  const outstanding = clientInvoices
    .filter((i) => i.status !== "Draft")
    .reduce((s, i) => s + i.total - i.received, 0);
  const base = `/clients/${code}`;
  const clients = byCode([client]);

  const ids: [string, string][] = [
    ["PAN", client.pan],
    ...(client.gstin ? ([["GSTIN", client.gstin]] as [string, string][]) : []),
    ...(client.tan ? ([["TAN", client.tan]] as [string, string][]) : []),
    ...(client.regNo
      ? ([[regLabel(client), client.regNo]] as [string, string][])
      : []),
  ];

  return (
    <div className="min-h-full bg-surface">
      <header className="border-b border-line px-3 pt-2.5 sm:px-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-ink-3"
        >
          <Link href="/clients" className="hover:text-ink">
            Clients
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <span className="ident">{client.code}</span>
        </nav>
        <div className="mt-1 flex flex-wrap items-start gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-lg font-semibold">
              <Signal aspect={aspect} />
              {client.name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-2">
              {client.constitution} · {client.industry} · {client.city} ·
              Partner {staff[client.partnerId]?.name} · Manager{" "}
              {staff[client.managerId]?.name}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <SampleAction done="Chat opened (sample)">
              <MessageCircle />
              WhatsApp
            </SampleAction>
            <SampleAction done="Upload dialog (sample)">
              <Upload />
              Upload
            </SampleAction>
            <SampleAction variant="primary" done="Task drafted (sample)">
              <Plus />
              New task
            </SampleAction>
          </div>
        </div>
        <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 pb-2.5">
          {ids.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <dt className="caps text-ink-3">{k}</dt>
              <dd>
                <CopyText value={v} label={k} />
              </dd>
            </div>
          ))}
        </dl>
        <Tabs
          label="Client sections"
          items={[
            { label: "Overview", href: base, active: tab === "overview" },
            {
              label: "Compliance",
              href: `${base}?tab=compliance`,
              active: tab === "compliance",
              count: open.length,
            },
            {
              label: "Books",
              href: `${base}?tab=books`,
              active: tab === "books",
            },
            {
              label: "Documents",
              href: `${base}?tab=documents`,
              active: tab === "documents",
              count: clientDocs.length,
            },
            {
              label: "Billing",
              href: `${base}?tab=billing`,
              active: tab === "billing",
              count: clientInvoices.length,
            },
            {
              label: "Activity",
              href: `${base}?tab=activity`,
              active: tab === "activity",
            },
          ]}
        />
      </header>

      {tab === "overview" && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:divide-x xl:divide-line">
          <div className="min-w-0 divide-y divide-line">
            <Panel
              id="matrix"
              title="FY 2026-27"
              meta="every form, month by month"
            >
              <ComplianceMatrix filings={filings} clientCode={code} />
            </Panel>
            <Panel
              id="open-filings"
              title="Open filings"
              meta={`${open.length}`}
              actions={
                <ButtonLink href={`${base}?tab=compliance`} variant="ghost">
                  All filings
                </ButtonLink>
              }
            >
              {open.length ? (
                <Register
                  filings={open}
                  clients={clients}
                  staff={staff}
                  showClient={false}
                  hrefFor={(id) => `/compliance?status=all&q=${code}&sel=${id}`}
                />
              ) : (
                <Empty title="Nothing open">
                  Every filing for this client is up to date.
                </Empty>
              )}
            </Panel>
          </div>
          <aside className="divide-y divide-line border-t border-line xl:border-t-0">
            {clientExceptions.length > 0 && (
              <Panel
                id="client-exceptions"
                title="Exceptions"
                meta={`${clientExceptions.length}`}
              >
                <ul className="divide-y divide-line">
                  {clientExceptions.map((x) => (
                    <li key={x.id}>
                      <Link
                        href={`/?sel=${x.id}`}
                        className="flex items-start gap-2.5 px-3 py-2 hover:bg-hover"
                      >
                        <Signal aspect={x.aspect} className="mt-0.5" />
                        <span className="min-w-0 text-sm">
                          <span className="block">{x.title}</span>
                          <span className="block text-xs text-ink-3">
                            {x.kind} · {staff[x.ownerId]?.name}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <Panel
              id="client-tasks"
              title="Open tasks"
              meta={`${clientTasks.length}`}
            >
              {clientTasks.length ? (
                <ul className="divide-y divide-line">
                  {clientTasks.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/work?sel=${t.id}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-3 py-2 hover:bg-hover"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">
                            {t.title}
                          </span>
                          <span className="block text-xs text-ink-3">
                            {staff[t.assigneeId]?.name} ·{" "}
                            <Status
                              kind="task"
                              value={t.status}
                              className="text-xs"
                            />
                          </span>
                        </span>
                        <DueIn due={t.due} className="text-sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="No open tasks" />
              )}
            </Panel>
            <Panel id="client-engagement" title="Engagement">
              <div className="px-3 py-2.5">
                <Facts
                  items={[
                    ["Services", client.services.join(", ")],
                    [
                      "Retainer",
                      <span key="r" className="figures">
                        {inr(client.feeAnnual)} a year
                      </span>,
                    ],
                    [
                      "Fees due",
                      <span key="o" className="figures">
                        {outstanding ? inr(outstanding) : "Nil"}
                      </span>,
                    ],
                    [
                      "Unbilled",
                      <span key="u" className="figures">
                        {clientUnbilled.length
                          ? inr(clientUnbilled.reduce((s, u) => s + u.value, 0))
                          : "Nil"}
                      </span>,
                    ],
                    ["GST scheme", client.gstScheme],
                    ["Client since", date(client.since)],
                  ]}
                />
              </div>
            </Panel>
            <Panel id="client-contact" title="Contact">
              <div className="px-3 py-2.5">
                <ContactBlock client={client} />
              </div>
            </Panel>
          </aside>
        </div>
      )}

      {tab === "compliance" && (
        <Register
          filings={filings.slice().sort((a, b) => a.due.localeCompare(b.due))}
          clients={clients}
          staff={staff}
          showClient={false}
          hrefFor={(id) => `/compliance?status=all&q=${code}&sel=${id}`}
        />
      )}

      {tab === "books" &&
        (books ? (
          <div className="divide-y divide-line">
            <div className="flex flex-wrap items-stretch divide-x divide-line max-sm:divide-x-0">
              {[
                [
                  "Sales, Apr to Oct",
                  books.trialBalance.find((r) => r.ledger.startsWith("Sales"))
                    ?.credit ?? 0,
                ],
                [
                  "Purchases, Apr to Oct",
                  books.trialBalance.find((r) =>
                    r.ledger.startsWith("Purchases"),
                  )?.debit ?? 0,
                ],
                [
                  "Debtors",
                  books.trialBalance.find((r) => r.ledger === "Sundry debtors")
                    ?.debit ?? 0,
                ],
                [
                  "Creditors",
                  books.trialBalance.find(
                    (r) => r.ledger === "Sundry creditors",
                  )?.credit ?? 0,
                ],
                [
                  "Bank, HDFC CA",
                  books.trialBalance.find((r) => r.ledger === "HDFC Bank CA")
                    ?.debit ?? 0,
                ],
              ].map(([k, v]) => (
                <p
                  key={k as string}
                  className="flex h-11 items-center gap-2 px-4"
                >
                  <span className="text-lg font-bold condensed tabular-nums">
                    {inrShort(v as number)}
                  </span>
                  <span className="text-sm text-ink-2">{k}</span>
                </p>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-ink-2">
              Oct 2026 day book has {books.vouchers.length} vouchers;{" "}
              {books.bankLines.filter((b) => b.match !== "Matched").length} bank
              lines need attention.
              <ButtonLink href={`/books?client=${code}`} variant="primary">
                Open books
                <ArrowUpRight />
              </ButtonLink>
            </div>
          </div>
        ) : (
          <Empty title="Books are not kept in Fin Ops for this client">
            This client&apos;s books are maintained in their own accounting
            software. In this sample, the books module is populated for Mehta
            Textiles (MEH-014).
          </Empty>
        ))}

      {tab === "documents" &&
        (clientDocs.length ? (
          <DocTable
            docs={clientDocs}
            showClient={false}
            hrefFor={(id) => `/documents?sel=${id}`}
          />
        ) : (
          <Empty title="No documents yet">
            Files the client sends on WhatsApp or email land here once
            classified.
          </Empty>
        ))}

      {tab === "billing" && (
        <div className="divide-y divide-line">
          {clientInvoices.length ? (
            <InvoiceTable
              invoices={clientInvoices}
              clients={clients}
              showClient={false}
              hrefFor={(id) => `/billing?sel=${id}`}
            />
          ) : (
            <Empty title="No invoices this FY" />
          )}
          {clientUnbilled.length > 0 && (
            <Panel id="unbilled" title="Unbilled work">
              <ul className="divide-y divide-line">
                {clientUnbilled.map((u) => (
                  <li
                    key={u.work}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <span className="flex-1">{u.work}</span>
                    <span className="text-ink-3 figures">{u.hours} h</span>
                    <span className="w-24 text-right figures">
                      {amount(u.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {tab === "activity" && (
        <ol className="divide-y divide-line">
          {filings
            .flatMap((f) =>
              filingActivity(f, staff).map((a) => ({
                ...a,
                text: `${f.form} ${f.period}: ${a.text}`,
              })),
            )
            .filter((a) => a.at.slice(0, 10) <= TODAY)
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .slice(0, 30)
            .map((a) => (
              <li
                key={a.at + a.text}
                className="grid grid-cols-[8rem_7rem_1fr] gap-x-4 px-4 py-2 text-sm"
              >
                <span className="text-ink-3 figures">{dateTime(a.at)}</span>
                <span className="text-ink-2">{a.who}</span>
                <span className="min-w-0 break-words">{a.text}</span>
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}
