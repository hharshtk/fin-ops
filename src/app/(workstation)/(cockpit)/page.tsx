import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, Skeleton, TableSkeleton } from "@/components/ui/misc";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import {
  getClients,
  getCurrentUser,
  getDocuments,
  getExceptions,
  getFilings,
  getInvoices,
  getStaff,
  getTasks,
  toDueBatches,
} from "@/data/queries";
import { DueBoard, DueBoardMeta } from "@/features/cockpit/due-board";
import { ExceptionsTable } from "@/features/cockpit/exceptions-table";
import { CockpitPanel } from "@/features/cockpit/panel";
import {
  scopeExceptions,
  scopeFilings,
  scopeOf,
} from "@/features/cockpit/scope";
import {
  InboxList,
  MyWorkList,
  ReceivablesAgeing,
  TeamLoadList,
} from "@/features/cockpit/strip";
import { SummaryLine } from "@/features/cockpit/summary-line";
import { daysBetween, inrShort, weekday, date } from "@/lib/format";
import { byCode, byId } from "@/lib/names";
import { ASPECT_RANK } from "@/lib/signal";
import { TODAY } from "@/lib/today";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Cockpit" };

export default function CockpitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<CockpitSkeleton />}>
      <Cockpit params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Cockpit({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const scope = scopeOf(sp);
  const selParam = param(sp, "sel");

  const [
    filings,
    exceptions,
    tasks,
    staffList,
    clientList,
    docs,
    invoices,
    me,
  ] = await Promise.all([
    getFilings(),
    getExceptions(),
    getTasks(),
    getStaff(),
    getClients(),
    getDocuments(),
    getInvoices(),
    getCurrentUser(),
  ]);
  const staff = byId(staffList);
  const clients = byCode(clientList);

  const scoped = scopeFilings(filings, clients, me.id, scope);
  const batches = toDueBatches(scoped, 14);
  const exceptionsScoped = scopeExceptions(exceptions, clients, me.id, scope)
    .slice()
    .sort(
      (a, b) =>
        ASPECT_RANK[a.aspect] - ASPECT_RANK[b.aspect] ||
        (a.due ?? "9999").localeCompare(b.due ?? "9999"),
    );

  const open = scoped.filter((f) => f.status !== "Filed");
  const overdue = open.filter((f) => f.due < TODAY).length;
  const within3 = open.filter((f) => {
    const d = daysBetween(TODAY, f.due);
    return d >= 0 && d <= 3;
  }).length;
  const within7 = open.filter((f) => {
    const d = daysBetween(TODAY, f.due);
    return d > 3 && d <= 7;
  }).length;
  const awaiting = open.filter((f) => f.status === "Awaiting data").length;
  const filedThisMonth = scoped.filter(
    (f) => f.filedOn && f.filedOn >= "2026-11-01",
  ).length;
  const feesOverdue = invoices
    .filter((i) => i.status !== "Draft" && i.due < TODAY)
    .reduce((s, i) => s + i.total - i.received, 0);
  const toClassify = docs.filter((d) => d.status === "To classify");

  const myTasks = tasks
    .filter(
      (t) =>
        t.status !== "Done" &&
        (t.assigneeId === me.id || t.reviewerId === me.id),
    )
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 7);

  // A row selected through the path renders in the layout's panel slot; otherwise the Cockpit
  // shows its own default inspector (`?sel=` from another screen, or the first batch).
  const selectedId = inspectId ?? selParam;
  const shownId = selectedId ?? batches[0]?.key;
  const hrefFor = (key: string) => inspectHref("", key, sp);

  return (
    <div className="contents">
      <div className="[grid-area:top]">
        <PageHeader
          title="Cockpit"
          meta={`${weekday(TODAY)} ${date(TODAY)} · 10:42 IST`}
          actions={
            <Segmented
              label="Scope"
              items={[
                {
                  label: "Firm",
                  href: hrefWith("/", sp, { scope: null }),
                  active: scope === "firm",
                },
                {
                  label: "My clients and work",
                  href: hrefWith("/", sp, { scope: "mine" }),
                  active: scope === "mine",
                },
              ]}
            />
          }
        />
        <SummaryLine
          items={[
            {
              label: "overdue",
              value: overdue,
              aspect: "red",
              tone: overdue ? "red" : undefined,
              href: "/compliance?status=overdue",
            },
            {
              label: "due in 3 days",
              value: within3,
              aspect: "yellow",
              href: "/compliance?status=due",
            },
            {
              label: "due in 7 days",
              value: within7,
              aspect: "double-yellow",
              href: "/compliance?status=week",
            },
            {
              label: "awaiting client",
              value: awaiting,
              href: "/compliance?status=awaiting",
            },
            {
              label: "filed in Nov",
              value: filedThisMonth,
              href: "/compliance?status=filed",
            },
            {
              label: "fees overdue",
              value: inrShort(feesOverdue),
              href: "/billing?status=overdue",
            },
            {
              label: "to classify",
              value: toClassify.length,
              href: "/documents?status=classify",
            },
          ]}
        />
      </div>
      <div className="min-w-0 [grid-area:main]">
        <Panel
          id="due-board"
          title="Due Board"
          meta={<DueBoardMeta count={batches.length} />}
          actions={
            <ButtonLink href="/compliance?view=calendar" variant="ghost">
              Calendar
            </ButtonLink>
          }
          className="border-b border-line"
        >
          {batches.length > 0 ? (
            <DueBoard batches={batches} selected={shownId} hrefFor={hrefFor} />
          ) : (
            <Empty title="Nothing due in the next 14 days">
              Filings appear here once they are within two weeks of their due
              date, or as soon as they go overdue.
            </Empty>
          )}
        </Panel>

        <div className="grid border-b border-line max-2xl:divide-y max-2xl:divide-line 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] 2xl:divide-x 2xl:divide-line">
          <Panel
            id="exceptions"
            title="Exceptions"
            meta={`${exceptionsScoped.length} open`}
          >
            {exceptionsScoped.length > 0 ? (
              <ExceptionsTable
                items={exceptionsScoped}
                staff={staff}
                selected={shownId}
                hrefFor={hrefFor}
              />
            ) : (
              <Empty title="No exceptions in your scope">
                Mismatches, notices, expiring DSCs and overdue fees land here.
              </Empty>
            )}
          </Panel>
          <Panel
            id="my-work"
            title="My work"
            meta={`${myTasks.length} next up`}
            actions={
              <ButtonLink href="/work?who=me" variant="ghost">
                All
              </ButtonLink>
            }
          >
            <MyWorkList tasks={myTasks} clients={clients} />
          </Panel>
        </div>

        <div className="grid max-lg:divide-y max-lg:divide-line lg:grid-cols-3 lg:divide-x lg:divide-line">
          <Panel id="team-load" title="Team load" meta="this week, hours">
            <TeamLoadList staff={staffList} />
          </Panel>
          <Panel id="receivables" title="Fee receivables" meta="by age">
            <ReceivablesAgeing invoices={invoices} />
          </Panel>
          <Panel
            id="inbox"
            title="Inbox"
            meta={`${toClassify.length} to classify`}
          >
            <InboxList docs={toClassify.slice(0, 6)} />
          </Panel>
        </div>
      </div>

      {!inspectId && (
        <DefaultPanelGate>
          <CockpitPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}

function CockpitSkeleton() {
  return (
    <div className="contents">
      <div className="[grid-area:top]">
        <PageHeader title="Cockpit" />
        <div className="flex h-11 items-center gap-8 border-b border-line bg-surface px-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-24" />
          ))}
        </div>
      </div>
      <div className="min-w-0 [grid-area:main]">
        <TableSkeleton rows={12} cols={9} />
      </div>
      <div className="hidden border-l border-line bg-surface [grid-area:panel] lg:block lg:w-[21rem] 2xl:w-[24rem]" />
    </div>
  );
}
