import { Suspense } from "react";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Avatar, LoadBar, TableSkeleton } from "@/components/ui/misc";
import { PageHeader } from "@/components/ui/page-header";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import { getCurrentUser, getFilings, getStaff, getTasks } from "@/data/queries";
import { cn } from "@/lib/cn";
import { defaultPerson, teamRows } from "@/features/team/load";
import { TeamPanel } from "@/features/team/panel";
import { inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Team" };

export default function TeamPage({
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
          <PageHeader title="Team" />
          <TableSkeleton rows={10} cols={8} />
        </>
      }
    >
      <Team params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Team({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const selParam = param(sp, "sel");
  const [staff, tasks, filings, me] = await Promise.all([
    getStaff(),
    getTasks(),
    getFilings(),
    getCurrentUser(),
  ]);
  const path = "/team";

  const rows = teamRows(staff, tasks, filings);
  const totalCap = staff.reduce((x, s) => x + s.capacityHours, 0);
  const totalLoad = staff.reduce((x, s) => x + s.assignedHours, 0);
  const overloaded = staff.filter((s) => s.assignedHours > s.capacityHours);

  const selectedId =
    inspectId ?? (rows.some((r) => r.s.id === selParam) ? selParam : undefined);
  const shownId = selectedId ?? defaultPerson(rows)?.s.id;

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader title="Team" meta="week of 16/11/2026" />
        <div className="scroll-thin overflow-x-auto border-b border-line bg-surface">
          <ul className="flex min-w-max divide-x divide-line">
            <li className="flex h-11 items-center gap-2 px-4">
              <span className="text-lg font-bold condensed tabular-nums">
                {totalLoad}/{totalCap}h
              </span>
              <span className="text-sm text-ink-2">scheduled this week</span>
            </li>
            <li className="flex h-11 items-center gap-2 px-4">
              <span
                className={cn(
                  "text-lg font-bold condensed tabular-nums",
                  overloaded.length > 0 && "text-sig-red-ink",
                )}
              >
                {overloaded.length}
              </span>
              <span className="text-sm text-ink-2">over capacity</span>
            </li>
            <li className="flex h-11 items-center gap-2 px-4">
              <span className="text-lg font-bold condensed tabular-nums">
                {tasks.filter((t) => t.status === "In review").length}
              </span>
              <span className="text-sm text-ink-2">waiting for review</span>
            </li>
          </ul>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <Table label="Team load" className="min-w-[48rem]">
            <thead>
              <tr>
                <Th>Person</Th>
                <Th width="6.5rem" className="max-2xl:hidden">
                  Role
                </Th>
                <Th width="13rem">Load against capacity</Th>
                <Th width="6rem" align="right">
                  Hours
                </Th>
                <Th width="5.5rem" align="right">
                  Tasks
                </Th>
                <Th width="6rem" align="right">
                  Reviews
                </Th>
                <Th width="7rem" align="right">
                  Due this week
                </Th>
                <Th width="6.5rem" align="right">
                  Late filings
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, open, reviews, lateFilings, weekFilings }) => {
                const over = s.assignedHours > s.capacityHours;
                return (
                  <Tr key={s.id}>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar initials={s.initials} name={s.name} />
                        <RowLink
                          href={inspectHref(path, s.id, sp)}
                          selected={s.id === shownId}
                          className="font-medium"
                        >
                          {s.name}
                        </RowLink>
                        {s.id === me.id && (
                          <span className="text-xs text-ink-3">you</span>
                        )}
                      </span>
                    </Td>
                    <Td className="text-ink-2 max-2xl:hidden">{s.role}</Td>
                    <Td>
                      <LoadBar
                        assigned={s.assignedHours}
                        capacity={s.capacityHours}
                      />
                    </Td>
                    <Td
                      align="right"
                      className={over ? "font-semibold text-sig-red-ink" : ""}
                    >
                      {s.assignedHours}/{s.capacityHours}
                    </Td>
                    <Td align="right">
                      {open.length || <span className="text-ink-4">·</span>}
                    </Td>
                    <Td align="right">
                      {reviews.length || <span className="text-ink-4">·</span>}
                    </Td>
                    <Td align="right">
                      {weekFilings.length || (
                        <span className="text-ink-4">·</span>
                      )}
                    </Td>
                    <Td align="right">
                      {lateFilings.length ? (
                        <span className="font-semibold text-sig-red-ink">
                          {lateFilings.length}
                        </span>
                      ) : (
                        <span className="text-ink-4">·</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        <p className="px-4 py-3 text-xs text-ink-3">
          The bar is drawn to a 56-hour scale; the black tick marks each
          person&apos;s capacity, and red is the overflow beyond it.
        </p>
      </div>
      {!inspectId && (
        <DefaultPanelGate>
          <TeamPanel id={shownId} sp={sp} explicit={Boolean(selectedId)} />
        </DefaultPanelGate>
      )}
    </div>
  );
}
