import { ArrowUpRight, Play } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Checklist } from "@/components/ui/checklist";
import { Textarea } from "@/components/ui/field";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import type { Client, Filing, StaffMember, Task } from "@/domain/types";
import { addDays, date, dayMonth } from "@/lib/format";
import { aspectFor } from "@/lib/signal";
import { TODAY } from "@/lib/today";

export function TaskInspector({
  task: t,
  client,
  filing,
  staff,
}: {
  task: Task;
  client?: Client;
  filing?: Filing;
  staff: Record<string, StaffMember>;
}) {
  const done = t.status === "Done";
  const assignee = staff[t.assigneeId];
  const reviewer = staff[t.reviewerId];
  const log =
    t.loggedHours > 0
      ? [
          {
            day: addDays(TODAY, -1),
            hours: Math.round(t.loggedHours * 0.6 * 4) / 4,
            note: "Working papers",
          },
          {
            day: addDays(TODAY, -3),
            hours: Math.round(t.loggedHours * 0.4 * 4) / 4,
            note: "Data review",
          },
        ].filter((l) => l.hours > 0)
      : [];

  return (
    <>
      <InspectorHead
        aside={<Signal aspect={aspectFor(t.due, done)} />}
        title={t.title}
        meta={
          <>
            {t.type} · {client?.name ?? t.clientCode}
          </>
        }
      />
      <InspectorActions>
        {!done && t.status !== "In review" && (
          <SampleAction
            variant="primary"
            done={`Sent to ${reviewer?.name.split(" ")[0] ?? "reviewer"}`}
          >
            Send for review
          </SampleAction>
        )}
        {t.status === "In review" && (
          <SampleAction variant="primary" done="Approved">
            Approve
          </SampleAction>
        )}
        {!done && (
          <SampleAction done="Timer running (sample)">
            <Play />
            Start timer
          </SampleAction>
        )}
        {client && (
          <ButtonLink href={`/clients/${client.code}`} variant="ghost">
            Client
            <ArrowUpRight />
          </ButtonLink>
        )}
      </InspectorActions>

      <InspectorSection title="Task">
        <Facts
          items={[
            ["Status", <Status key="s" kind="task" value={t.status} />],
            [
              "Due",
              <span key="d">
                {date(t.due)} · <DueIn due={t.due} done={done} />
              </span>,
            ],
            ["Assignee", assignee?.name ?? "Unassigned"],
            ["Reviewer", reviewer?.name ?? "—"],
            [
              "Hours",
              <span
                key="h"
                className={
                  t.loggedHours > t.estimateHours
                    ? "text-sig-red-ink figures"
                    : "figures"
                }
              >
                {t.loggedHours} logged of {t.estimateHours} estimated
              </span>,
            ],
            ...(filing
              ? ([
                  [
                    "Filing",
                    <Link
                      key="f"
                      href={`/compliance?status=all&q=${filing.clientCode}&sel=${filing.id}`}
                      className="text-navy underline"
                    >
                      {filing.form} {filing.period}
                    </Link>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
      </InspectorSection>

      <InspectorSection title="Checklist">
        <Checklist key={t.id} idPrefix={t.id} items={t.checklist} />
      </InspectorSection>

      {log.length > 0 && (
        <InspectorSection title="Time">
          <ul className="flex flex-col gap-1">
            {log.map((l) => (
              <li
                key={l.day}
                className="grid grid-cols-[3.5rem_1fr_3rem] text-sm"
              >
                <span className="text-ink-3 figures">{dayMonth(l.day)}</span>
                <span className="text-ink-2">
                  {assignee?.name.split(" ")[0]} · {l.note}
                </span>
                <span className="text-right figures">{l.hours}h</span>
              </li>
            ))}
          </ul>
        </InspectorSection>
      )}

      <InspectorSection title="Comments">
        <p className="mb-2 text-sm text-ink-2">
          <span className="text-ink">{reviewer?.name.split(" ")[0]}</span> ·
          Please attach the working before sending for review.
        </p>
        <label htmlFor={`${t.id}-comment`} className="sr-only">
          Add a comment
        </label>
        <Textarea
          id={`${t.id}-comment`}
          placeholder="Add a comment. @ to mention"
          rows={2}
        />
      </InspectorSection>
    </>
  );
}
