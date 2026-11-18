import { LayoutGrid, Plus, Rows3, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SearchField, SearchFieldFallback } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import type { Client } from "@/domain/types";
import { getClients, getFilings, getInvoices, getStaff } from "@/data/queries";
import { ClientsPanel } from "@/features/clients/panel";
import { ClientBook, ClientTable } from "@/features/clients/client-views";
import { buildClientRows } from "@/features/clients/rows";
import { byId } from "@/lib/names";
import { ASPECT_RANK } from "@/lib/signal";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Clients" };

const TYPES: { key: string; label: string; test: (c: Client) => boolean }[] = [
  { key: "", label: "All", test: () => true },
  {
    key: "company",
    label: "Companies",
    test: (c) => ["Private Ltd", "Public Ltd", "OPC"].includes(c.constitution),
  },
  { key: "llp", label: "LLPs", test: (c) => c.constitution === "LLP" },
  {
    key: "firm",
    label: "Firms",
    test: (c) => c.constitution === "Partnership",
  },
  {
    key: "prop",
    label: "Proprietors",
    test: (c) => c.constitution === "Proprietorship",
  },
  {
    key: "individual",
    label: "Individuals and HUFs",
    test: (c) => ["Individual", "HUF"].includes(c.constitution),
  },
  { key: "trust", label: "Trusts", test: (c) => c.constitution === "Trust" },
];

export default function ClientsPage({
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
          <PageHeader title="Clients" />
          <Toolbar>
            <SearchFieldFallback
              placeholder="Code, name, PAN or GSTIN"
              className="w-64"
            />
          </Toolbar>
          <TableSkeleton rows={16} cols={9} />
        </>
      }
    >
      <Clients params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Clients({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const view = param(sp, "view") === "book" ? "book" : "table";
  const typeKey = param(sp, "type") ?? "";
  const partner = param(sp, "partner");
  const svc = param(sp, "svc");
  const q = (param(sp, "q") ?? "").toLowerCase();
  const selParam = param(sp, "sel");

  const [clients, filings, invoices, staffList] = await Promise.all([
    getClients(),
    getFilings(),
    getInvoices(),
    getStaff(),
  ]);
  const staff = byId(staffList);
  const type = TYPES.find((t) => t.key === typeKey) ?? TYPES[0]!;
  const allRows = buildClientRows(clients, filings, invoices);

  const filtered = allRows
    .filter(({ client: c }) => {
      if (!type.test(c)) return false;
      if (partner && c.partnerId !== partner) return false;
      if (svc && !c.services.includes(svc as Client["services"][number]))
        return false;
      if (
        q &&
        !`${c.code} ${c.name} ${c.pan} ${c.gstin ?? ""} ${c.city}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    })
    .sort((a, b) =>
      view === "book"
        ? ASPECT_RANK[a.aspect] - ASPECT_RANK[b.aspect] ||
          b.overdue - a.overdue ||
          a.client.code.localeCompare(b.client.code)
        : a.client.name.localeCompare(b.client.name),
    );

  const path = "/clients";
  const selectedId =
    inspectId ??
    (clients.some((c) => c.code === selParam) ? selParam : undefined);
  const shownId =
    selectedId ?? (view === "table" ? filtered[0]?.client.code : undefined);
  const hrefFor = (code: string) => inspectHref(path, code, sp);
  const partners = staffList.filter((s) => s.role === "Partner");

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Clients"
          meta={`${filtered.length} of ${clients.length}`}
          actions={
            <>
              <Segmented
                label="View"
                items={[
                  {
                    label: (
                      <>
                        <Rows3 aria-hidden />
                        Table
                      </>
                    ),
                    href: hrefWith(path, sp, { view: null }),
                    active: view === "table",
                  },
                  {
                    label: (
                      <>
                        <LayoutGrid aria-hidden />
                        Book
                      </>
                    ),
                    href: hrefWith(path, sp, { view: "book" }),
                    active: view === "book",
                  },
                ]}
              />
              <ButtonLink href="/clients/new" variant="primary">
                <Plus />
                New client
              </ButtonLink>
            </>
          }
        />
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Constitution"
            items={TYPES.map((t) => ({
              label: t.label,
              href: hrefWith(path, sp, { type: t.key || null }),
              active: type.key === t.key,
              count: clients.filter(t.test).length,
            }))}
          />
        </div>
        <Toolbar>
          <Segmented
            label="Partner"
            items={[
              {
                label: "All partners",
                href: hrefWith(path, sp, { partner: null }),
                active: !partner,
              },
              ...partners.map((p) => ({
                label: p.name.split(" ")[0]!,
                href: hrefWith(path, sp, { partner: p.id }),
                active: partner === p.id,
              })),
            ]}
          />
          {svc && (
            <Link
              href={hrefWith(path, sp, { svc: null })}
              className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-select px-2 text-sm hover:bg-line"
              aria-label={`Remove filter ${svc}`}
            >
              Service: {svc}
              <X aria-hidden className="size-3 text-ink-3" />
            </Link>
          )}
          <SearchField
            placeholder="Code, name, PAN or GSTIN"
            className="w-full sm:ml-auto sm:w-64"
          />
        </Toolbar>

        {filtered.length === 0 ? (
          <Empty
            title="No clients match"
            action={
              <ButtonLink href={path} variant="secondary">
                Clear filters
              </ButtonLink>
            }
          >
            Search covers client code, name, PAN, GSTIN and city.
          </Empty>
        ) : view === "book" ? (
          <ClientBook
            selected={shownId}
            hrefFor={hrefFor}
            groups={partners
              .map((p) => ({
                title: `${p.name}, partner`,
                rows: filtered.filter((r) => r.client.partnerId === p.id),
              }))
              .filter((g) => g.rows.length > 0)}
          />
        ) : (
          <ClientTable
            rows={filtered}
            staff={staff}
            selected={shownId}
            hrefFor={hrefFor}
          />
        )}
      </div>

      {!inspectId && (
        <DefaultPanelGate>
          <ClientsPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
