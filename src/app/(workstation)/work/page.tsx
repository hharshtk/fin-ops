import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SearchField, SearchFieldFallback } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import type { Task, TaskStatus } from "@/domain/types";
import { getClients, getCurrentUser, getStaff, getTasks } from "@/data/queries";
import { WorkPanel } from "@/features/work/panel";
import { TaskTable } from "@/features/work/task-table";
import { byCode, byId } from "@/lib/names";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Work" };

const STATUS_ORDER: TaskStatus[] = [
  "In review",
  "In progress",
  "Waiting on client",
  "To do",
  "Done",
];
const STATUS_KEYS: Record<string, TaskStatus> = {
  review: "In review",
  progress: "In progress",
  waiting: "Waiting on client",
  todo: "To do",
  done: "Done",
};

export default function WorkPage({
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
          <PageHeader title="Work" />
          <Toolbar>
            <SearchFieldFallback placeholder="Filter tasks" className="w-64" />
          </Toolbar>
          <TableSkeleton rows={14} cols={8} />
        </>
      }
    >
      <Work params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Work({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const who = param(sp, "who");
  const statusKey = param(sp, "status");
  const group = param(sp, "group") === "assignee" ? "assignee" : "status";
  const q = (param(sp, "q") ?? "").toLowerCase();
  const selParam = param(sp, "sel");

  const [tasks, clientList, staffList, me] = await Promise.all([
    getTasks(),
    getClients(),
    getStaff(),
    getCurrentUser(),
  ]);
  const clients = byCode(clientList);
  const staff = byId(staffList);
  const whoId = who === "me" ? me.id : who;
  const status = statusKey ? STATUS_KEYS[statusKey] : undefined;

  const rows = tasks
    .filter((t) => {
      if (whoId && t.assigneeId !== whoId && t.reviewerId !== whoId)
        return false;
      if (status && t.status !== status) return false;
      if (!status && t.status === "Done" && statusKey !== "all") return false;
      if (
        q &&
        !`${t.title} ${t.clientCode} ${clients[t.clientCode]?.name ?? ""} ${t.type}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    })
    .sort((a, b) => a.due.localeCompare(b.due));

  const groups: { title: string; tasks: Task[] }[] =
    group === "assignee"
      ? staffList
          .map((s) => ({
            title: `${s.name} · ${s.role}`,
            tasks: rows.filter((t) => t.assigneeId === s.id),
          }))
          .filter((g) => g.tasks.length > 0)
      : STATUS_ORDER.map((s) => ({
          title: s,
          tasks: rows.filter((t) => t.status === s),
        })).filter((g) => g.tasks.length > 0);

  const path = "/work";
  const ordered = groups.flatMap((g) => g.tasks);
  const selectedId =
    inspectId ?? (tasks.some((t) => t.id === selParam) ? selParam : undefined);
  const shownId = selectedId ?? ordered[0]?.id;
  const countFor = (s?: TaskStatus) =>
    tasks.filter(
      (t) =>
        (!whoId || t.assigneeId === whoId || t.reviewerId === whoId) &&
        (s ? t.status === s : t.status !== "Done"),
    ).length;

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Work"
          meta={`${rows.length} tasks`}
          actions={
            <Segmented
              label="Group by"
              items={[
                {
                  label: "By status",
                  href: hrefWith(path, sp, { group: null }),
                  active: group === "status",
                },
                {
                  label: "By person",
                  href: hrefWith(path, sp, { group: "assignee" }),
                  active: group === "assignee",
                },
              ]}
            />
          }
        />
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Status"
            items={[
              {
                label: "Open",
                href: hrefWith(path, sp, { status: null }),
                active: !statusKey,
                count: countFor(),
              },
              ...Object.entries(STATUS_KEYS).map(([k, s]) => ({
                label: s,
                href: hrefWith(path, sp, { status: k }),
                active: statusKey === k,
                count: countFor(s),
              })),
            ]}
          />
        </div>
        <Toolbar>
          <Segmented
            label="People"
            items={[
              {
                label: "Everyone",
                href: hrefWith(path, sp, { who: null }),
                active: !who,
              },
              {
                label: "Mine",
                href: hrefWith(path, sp, { who: "me" }),
                active: who === "me",
              },
            ]}
          />
          {who && who !== "me" && (
            <span className="text-sm text-ink-2">
              Showing {staff[who]?.name}
            </span>
          )}
          <SearchField
            placeholder="Filter tasks"
            className="w-full sm:ml-auto sm:w-64"
          />
        </Toolbar>
        {rows.length ? (
          <TaskTable
            groups={groups}
            clients={clients}
            staff={staff}
            selected={shownId}
            hrefFor={(id) => inspectHref(path, id, sp)}
          />
        ) : (
          <Empty
            title="No tasks here"
            action={
              <ButtonLink href={path} variant="secondary">
                Show all open tasks
              </ButtonLink>
            }
          >
            Tasks are created from filings as they approach their due date, and
            by hand for audits, notices and advisory work.
          </Empty>
        )}
      </div>
      {!inspectId && (
        <DefaultPanelGate>
          <WorkPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
