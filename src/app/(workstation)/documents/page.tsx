import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SampleAction } from "@/components/ui/sample-action";
import { SearchField, SearchFieldFallback } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import type { DocumentItem } from "@/domain/types";
import { getDocuments } from "@/data/queries";
import { DocumentsPanel } from "@/features/documents/panel";
import { DocTable } from "@/features/documents/doc-table";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Documents" };

const STATUS: {
  key: string;
  label: string;
  test: (d: DocumentItem) => boolean;
}[] = [
  {
    key: "classify",
    label: "To classify",
    test: (d) => d.status === "To classify",
  },
  {
    key: "query",
    label: "Query raised",
    test: (d) => d.status === "Query raised",
  },
  { key: "linked", label: "Filed", test: (d) => d.status === "Linked" },
  { key: "all", label: "All", test: () => true },
];
const SOURCES = ["WhatsApp", "Email", "Upload", "Portal"] as const;

export default function DocumentsPage({
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
          <PageHeader title="Documents" />
          <Toolbar>
            <SearchFieldFallback
              placeholder="File, client or type"
              className="w-64"
            />
          </Toolbar>
          <TableSkeleton rows={12} cols={7} />
        </>
      }
    >
      <Documents params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Documents({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const statusKey = param(sp, "status") ?? "classify";
  const source = param(sp, "source");
  const q = (param(sp, "q") ?? "").toLowerCase();
  const selParam = param(sp, "sel");
  const docs = await getDocuments();
  const status = STATUS.find((s) => s.key === statusKey) ?? STATUS[0]!;

  const rows = docs
    .filter((d) => {
      if (!status.test(d)) return false;
      if (source && d.source !== source) return false;
      if (
        q &&
        !`${d.name} ${d.clientCode ?? ""} ${d.kind} ${d.from}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    })
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));

  const path = "/documents";
  const selectedId =
    inspectId ?? (docs.some((d) => d.id === selParam) ? selParam : undefined);
  const shownId = selectedId ?? rows[0]?.id;

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Documents"
          meta="received from clients"
          actions={
            <SampleAction variant="primary" done="Upload dialog (sample)">
              Upload
            </SampleAction>
          }
        />
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Status"
            items={STATUS.map((s) => ({
              label: s.label,
              href: hrefWith(path, sp, {
                status: s.key === "classify" ? null : s.key,
              }),
              active: status.key === s.key,
              count: docs.filter(s.test).length,
            }))}
          />
        </div>
        <Toolbar>
          <Segmented
            label="Channel"
            items={[
              {
                label: "All channels",
                href: hrefWith(path, sp, { source: null }),
                active: !source,
              },
              ...SOURCES.map((s) => ({
                label: s,
                href: hrefWith(path, sp, { source: s }),
                active: source === s,
              })),
            ]}
          />
          <SearchField
            placeholder="File, client or type"
            className="w-full sm:ml-auto sm:w-64"
          />
        </Toolbar>
        {rows.length ? (
          <DocTable
            docs={rows}
            selected={shownId}
            hrefFor={(id) => inspectHref(path, id, sp)}
          />
        ) : (
          <Empty
            title={
              status.key === "classify"
                ? "Inbox is clear"
                : "No documents match"
            }
            action={
              <ButtonLink href={`${path}?status=all`} variant="secondary">
                Show all documents
              </ButtonLink>
            }
          >
            Files clients send on WhatsApp or email, and documents pulled from
            the GST and income tax portals, arrive here to be filed against a
            client and period.
          </Empty>
        )}
      </div>
      {!inspectId && (
        <DefaultPanelGate>
          <DocumentsPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
