import { ArrowUpRight, Check, Download, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import type { ActivityItem, Client, Filing, StaffMember } from "@/domain/types";
import { cn } from "@/lib/cn";
import { date, dateTime, weekday } from "@/lib/format";
import { aspectFor } from "@/lib/signal";
import { RecordFilingForm } from "./record-filing-form";

const STEPS: { label: string; reached: Filing["status"][] }[] = [
  {
    label: "Data from client",
    reached: ["In preparation", "In review", "Ready to file", "Filed"],
  },
  { label: "Prepared", reached: ["In review", "Ready to file", "Filed"] },
  { label: "Reviewed", reached: ["Ready to file", "Filed"] },
  { label: "Filed on portal", reached: ["Filed"] },
];

function identifierFor(f: Filing, c?: Client): [string, string] | null {
  if (!c) return null;
  if (f.regime === "GST" && c.gstin) return ["GSTIN", c.gstin];
  if (f.regime === "TDS" && c.tan) return ["TAN", c.tan];
  if (f.regime === "ROC" && c.regNo)
    return [c.constitution === "LLP" ? "LLPIN" : "CIN", c.regNo];
  return ["PAN", c.pan];
}

export function FilingInspector({
  filing: f,
  client,
  staff,
  activity,
  today,
}: {
  filing: Filing;
  client?: Client;
  staff: Record<string, StaffMember>;
  activity: ActivityItem[];
  today: string;
}) {
  const done = f.status === "Filed";
  const id = identifierFor(f, client);
  return (
    <>
      <InspectorHead
        aside={<Signal aspect={aspectFor(f.due, done)} />}
        title={`${f.form} · ${f.period}`}
        meta={client?.name ?? f.clientCode}
      />
      <InspectorActions>
        {f.status === "Awaiting data" && (
          <SampleAction variant="primary" done="Reminder queued">
            <MessageCircle />
            Remind on WhatsApp
          </SampleAction>
        )}
        {f.status === "Ready to file" && (
          <SampleAction variant="primary" done="Marked as filing in progress">
            Start filing
          </SampleAction>
        )}
        {done && (
          <SampleAction done="Downloaded (sample)">
            <Download />
            Acknowledgement
          </SampleAction>
        )}
        {client && (
          <ButtonLink
            href={`/clients/${client.code}?tab=compliance`}
            variant="ghost"
          >
            Client
            <ArrowUpRight />
          </ButtonLink>
        )}
      </InspectorActions>

      <InspectorSection title="Filing">
        <Facts
          items={[
            ...(id
              ? ([
                  [
                    id[0],
                    <span key="id" className="ident">
                      {id[1]}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            [
              "Due",
              <span key="due">
                {weekday(f.due)} {date(f.due)} ·{" "}
                <DueIn due={f.due} done={done} />
              </span>,
            ],
            ["Status", <Status key="s" kind="filing" value={f.status} />],
            ["Prepared by", staff[f.assigneeId]?.name ?? "Unassigned"],
            ["Reviewer", staff[f.reviewerId]?.name ?? "—"],
            ...(f.remindersSent > 0
              ? ([
                  [
                    "Reminders",
                    `${f.remindersSent} sent${f.lastReminder ? `, last ${date(f.lastReminder)}` : ""}`,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ...(done
              ? ([
                  ["Filed on", f.filedOn ? date(f.filedOn) : "—"],
                  [
                    "Reference",
                    <span key="ack" className="ident break-all">
                      {f.ackNo}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
        {f.note && (
          <p className="mt-3 border-t border-line pt-2.5 text-sm text-pretty text-ink-2">
            {f.note}
          </p>
        )}
      </InspectorSection>

      <InspectorSection title="Progress">
        <ol className="flex flex-col">
          {STEPS.map((s) => {
            const reached = s.reached.includes(f.status);
            return (
              <li
                key={s.label}
                className="flex h-7 items-center gap-2.5 text-sm"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    reached
                      ? "border-sig-green bg-sig-green text-white"
                      : "border-line-strong bg-surface",
                  )}
                >
                  {reached && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <span className={reached ? "text-ink" : "text-ink-3"}>
                  {s.label}
                </span>
                <span className="sr-only">{reached ? "done" : "pending"}</span>
              </li>
            );
          })}
        </ol>
      </InspectorSection>

      {!done && (
        <InspectorSection title="Record filing">
          <RecordFilingForm
            key={f.id}
            form={f.form}
            today={today}
            idPrefix={f.id}
          />
        </InspectorSection>
      )}

      <InspectorSection title="Activity">
        <ol className="flex flex-col gap-2">
          {activity.map((a) => (
            <li
              key={a.at + a.text}
              className="grid grid-cols-[6.5rem_1fr] gap-x-3 text-sm"
            >
              <span className="text-xs text-ink-3 figures">
                {dateTime(a.at)}
              </span>
              <span className="min-w-0 text-ink-2">
                <span className="text-ink">{a.who}</span> ·{" "}
                <span className="break-words">{a.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </InspectorSection>
    </>
  );
}
