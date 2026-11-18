import Link from "next/link";
import {
  Facts,
  Inspector,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { Avatar, Empty, LoadBar } from "@/components/ui/misc";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import { getFilings, getStaff, getTasks } from "@/data/queries";
import { aspectFor } from "@/lib/signal";
import { hrefWith, type SearchParams } from "@/lib/url";
import { teamRows } from "./load";

/** The Team inspector for one person, as the list's default or as an explicit selection. */
export async function TeamPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [staff, tasks, filings] = await Promise.all([
    getStaff(),
    getTasks(),
    getFilings(),
  ]);
  const shown = id
    ? teamRows(staff, tasks, filings).find((r) => r.s.id === id)
    : undefined;
  return (
    <Inspector
      label="Person"
      explicit={explicit}
      closeHref={explicit ? hrefWith("/team", sp, { sel: null }) : undefined}
    >
      {shown ? (
        <>
          <InspectorHead
            aside={<Avatar initials={shown.s.initials} name={shown.s.name} />}
            title={shown.s.name}
            meta={`${shown.s.role} · ${shown.s.assignedHours} of ${shown.s.capacityHours} hours this week`}
          />
          <InspectorActions>
            <SampleAction
              variant="primary"
              done="Reassignment drafted (sample)"
            >
              Rebalance work
            </SampleAction>
            <Link
              href={`/work?who=${shown.s.id}`}
              className="inline-flex h-7 items-center px-2 text-sm text-navy hover:underline"
            >
              All their tasks
            </Link>
          </InspectorActions>
          <InspectorSection title="This week">
            <LoadBar
              assigned={shown.s.assignedHours}
              capacity={shown.s.capacityHours}
            />
            <Facts
              className="mt-3"
              items={[
                ["Open tasks", String(shown.open.length)],
                ["Reviews pending", String(shown.reviews.length)],
                ["Filings due in 7 days", String(shown.weekFilings.length)],
                ["Late filings", String(shown.lateFilings.length)],
              ]}
            />
          </InspectorSection>
          <InspectorSection title={`Tasks (${shown.open.length})`}>
            {shown.open.length ? (
              <ul className="-mx-1 flex flex-col">
                {shown.open
                  .slice()
                  .sort((a, b) => a.due.localeCompare(b.due))
                  .map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/work?sel=${t.id}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 rounded-[3px] px-1 py-1 hover:bg-hover"
                      >
                        <Signal aspect={aspectFor(t.due)} />
                        <span className="truncate text-sm">{t.title}</span>
                        <DueIn due={t.due} className="text-sm" />
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-2">No open tasks.</p>
            )}
          </InspectorSection>
          {shown.lateFilings.length > 0 && (
            <InspectorSection title="Late filings">
              <ul className="-mx-1 flex flex-col">
                {shown.lateFilings.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/compliance?status=all&q=${f.clientCode}&sel=${f.id}`}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 rounded-[3px] px-1 py-1 hover:bg-hover"
                    >
                      <Signal aspect="red" />
                      <span className="truncate text-sm">
                        <span className="text-xs ident text-ink-3">
                          {f.clientCode}
                        </span>{" "}
                        {f.form} {f.period}
                      </span>
                      <DueIn due={f.due} className="text-sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </InspectorSection>
          )}
        </>
      ) : (
        <Empty title="Nothing selected" />
      )}
    </Inspector>
  );
}
