import { ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Checklist } from "@/components/ui/checklist";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { CompositionBar } from "@/components/ui/misc";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import type {
  Client,
  DueBatch,
  Filing,
  PracticeException,
  StaffMember,
  Task,
} from "@/domain/types";
import { date, dayMonth, inr, weekday } from "@/lib/format";
import { shortName } from "@/lib/names";
import { aspectFor } from "@/lib/signal";

const STATUS_ORDER: Filing["status"][] = [
  "Awaiting data",
  "Not started",
  "In preparation",
  "In review",
  "Ready to file",
  "Filed",
];

export function BatchInspector({
  batch,
  filings,
  clients,
  staff,
  tasks = [],
}: {
  batch: DueBatch;
  filings: Filing[];
  clients: Record<string, Client>;
  staff: Record<string, StaffMember>;
  tasks?: Task[];
}) {
  const taskFor: Record<string, string> = Object.fromEntries(
    tasks.filter((t) => t.filingId).map((t) => [t.filingId!, t.id]),
  );
  const open = filings
    .filter((f) => f.status !== "Filed")
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );
  const filed = filings.filter((f) => f.status === "Filed");
  const awaiting = open.filter((f) => f.status === "Awaiting data");
  const complianceHref = `/compliance?form=${encodeURIComponent(batch.form)}&period=${encodeURIComponent(batch.period)}`;

  return (
    <>
      <InspectorHead
        aside={<Signal aspect={aspectFor(batch.due, open.length === 0)} />}
        title={`${batch.form} · ${batch.period}`}
        meta={
          <>
            {batch.regime} · due {weekday(batch.due)} {date(batch.due)} ·{" "}
            <DueIn due={batch.due} done={open.length === 0} />
          </>
        }
      />
      <div className="border-b border-line px-4 py-3">
        <p className="mb-2 text-sm text-ink-2">
          <span className="text-lg font-bold text-ink condensed tabular-nums">
            {open.length}
          </span>{" "}
          of <span className="figures">{batch.total}</span> clients still open
        </p>
        <CompositionBar
          parts={[
            { label: "Filed", value: batch.filed, className: "bg-sig-green" },
            { label: "Ready", value: batch.ready, className: "bg-navy" },
            { label: "Review", value: batch.review, className: "bg-ink-3" },
            {
              label: "Prep",
              value: batch.inPrep + batch.notStarted,
              className: "bg-line-strong",
            },
            {
              label: "Awaiting client",
              value: batch.awaiting,
              className: "bg-sig-yellow",
            },
          ]}
        />
      </div>
      <InspectorActions>
        {awaiting.length > 0 ? (
          <SampleAction
            variant="primary"
            done={`Reminders queued for ${awaiting.length}`}
          >
            <MessageCircle />
            Remind {awaiting.length} on WhatsApp
          </SampleAction>
        ) : open.length > 0 ? (
          <SampleAction variant="primary" done="Batch marked for filing">
            Mark ready ones for filing
          </SampleAction>
        ) : null}
        <ButtonLink href={complianceHref}>
          Open in register
          <ArrowUpRight />
        </ButtonLink>
      </InspectorActions>
      {open.length > 0 && (
        <InspectorSection title={`Open (${open.length})`}>
          <ul className="-mx-1 flex flex-col">
            {open.map((f) => {
              const c = clients[f.clientCode];
              return (
                <li
                  key={f.id}
                  className="grid grid-cols-[1fr_auto] items-start gap-x-3 rounded-[3px] px-1 py-1.5 hover:bg-hover"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/clients/${f.clientCode}`}
                      className="block truncate text-sm hover:underline"
                      title="Open client workspace"
                    >
                      {c ? shortName(c.name) : f.clientCode}
                    </Link>
                    <span className="block text-xs text-ink-3">
                      <span className="ident">{f.clientCode}</span> ·{" "}
                      {staff[f.assigneeId]?.name ?? "Unassigned"}
                      {f.remindersSent > 0 && f.lastReminder
                        ? ` · ${f.remindersSent} reminder${f.remindersSent > 1 ? "s" : ""}, last ${dayMonth(f.lastReminder)}`
                        : ""}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <Link
                      href={`${complianceHref}&sel=${f.id}`}
                      title="Open filing in the register"
                      className="hover:underline"
                    >
                      <Status
                        kind="filing"
                        value={f.status}
                        className="text-xs"
                      />
                    </Link>
                    {taskFor[f.id] && (
                      <Link
                        href={`/work?sel=${taskFor[f.id]}`}
                        className="text-xs text-navy hover:underline"
                      >
                        Task
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </InspectorSection>
      )}
      {filed.length > 0 && (
        <InspectorSection title={`Filed (${filed.length})`}>
          <details className="group text-sm">
            <summary className="cursor-pointer list-none text-ink-2 hover:text-ink">
              <span className="group-open:hidden">
                Show filed clients and acknowledgements
              </span>
              <span className="hidden group-open:inline">Hide</span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {filed.map((f) => (
                <li
                  key={f.id}
                  className="grid grid-cols-[4.5rem_1fr] gap-x-2 text-xs"
                >
                  <span className="ident text-ink-2">{f.clientCode}</span>
                  <span className="truncate ident text-ink-3">
                    {f.filedOn ? dayMonth(f.filedOn) : ""} · {f.ackNo}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </InspectorSection>
      )}
    </>
  );
}

export function ExceptionInspector({
  item,
  client,
  owner,
}: {
  item: PracticeException;
  client?: Client;
  owner?: StaffMember;
}) {
  return (
    <>
      <InspectorHead
        aside={<Signal aspect={item.aspect} />}
        title={item.title}
        meta={
          <>
            {item.kind} · {client ? client.name : item.clientCode}
          </>
        }
      />
      <InspectorActions>
        <SampleAction variant="primary" done="Marked resolved">
          Mark resolved
        </SampleAction>
        <SampleAction done="Assigned to you">Assign to me</SampleAction>
        {client && (
          <ButtonLink href={`/clients/${client.code}`} variant="ghost">
            Client
            <ArrowUpRight />
          </ButtonLink>
        )}
      </InspectorActions>
      <InspectorSection title="Detail">
        <p className="mb-3 text-sm text-pretty text-ink">{item.detail}</p>
        <Facts
          items={[
            [
              "Client",
              <span key="c" className="ident">
                {item.clientCode}
              </span>,
            ],
            ["Raised", date(item.raised)],
            [
              "Due",
              item.due ? (
                <span key="d">
                  {date(item.due)} · <DueIn due={item.due} />
                </span>
              ) : (
                "No statutory date"
              ),
            ],
            ["Owner", owner?.name ?? "Unassigned"],
            ...(item.amount
              ? ([
                  [
                    "Amount",
                    <span key="a" className="figures">
                      {inr(item.amount)}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
      </InspectorSection>
      <InspectorSection title="Next steps">
        <Checklist
          key={item.id}
          idPrefix={item.id}
          items={item.steps.map((s) => ({ label: s, done: false }))}
        />
      </InspectorSection>
    </>
  );
}
