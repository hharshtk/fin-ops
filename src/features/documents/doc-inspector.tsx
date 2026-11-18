import { FileText } from "lucide-react";
import { Field, Select } from "@/components/ui/field";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import { Status } from "@/components/ui/status";
import type { Client, DocumentItem, Task } from "@/domain/types";
import { dateTime } from "@/lib/format";
import { shortName } from "@/lib/names";

const KINDS = [
  "Purchase invoices",
  "Sales register",
  "Bank statement",
  "Bank narration (UPI)",
  "Form 16",
  "Property deed",
  "Confirmations",
  "Shipping bills",
  "Payroll inputs",
  "Notice",
  "Agreement",
  "Other",
];

export function DocInspector({
  doc: d,
  clients,
  tasks,
}: {
  doc: DocumentItem;
  clients: Client[];
  tasks: Task[];
}) {
  const clientTasks = tasks.filter(
    (t) => t.clientCode === d.clientCode && t.status !== "Done",
  );
  return (
    <>
      <InspectorHead
        title={<span className="break-all">{d.name}</span>}
        meta={<Status kind="document" value={d.status} />}
      />
      <div className="border-b border-line px-4 py-3">
        <div className="flex h-36 flex-col items-center justify-center gap-2 border border-dashed border-line-strong bg-ground text-center">
          <FileText
            aria-hidden
            className="size-7 text-ink-4"
            strokeWidth={1.5}
          />
          <p className="text-xs text-ink-3">
            {d.pages ? `${d.pages} page${d.pages > 1 ? "s" : ""} · ` : ""}
            {d.sizeKb >= 1024
              ? `${(d.sizeKb / 1024).toFixed(1)} MB`
              : `${d.sizeKb} KB`}
            <br />
            Preview is not available for sample files
          </p>
        </div>
      </div>
      <InspectorSection title="Received">
        <Facts
          items={[
            ["From", d.from],
            ["Channel", d.source],
            [
              "At",
              <span key="t" className="figures">
                {dateTime(d.receivedAt)}
              </span>,
            ],
            ...(d.linkedTo
              ? ([["Linked to", d.linkedTo]] as [string, React.ReactNode][])
              : []),
          ]}
        />
      </InspectorSection>
      <InspectorSection title={d.status === "Linked" ? "Filed as" : "Classify"}>
        <div key={d.id} className="flex flex-col gap-3">
          <Field
            label="Client"
            htmlFor={`${d.id}-client`}
            hint={
              d.clientCode
                ? "Matched from the sender's number"
                : "Sender not recognised"
            }
          >
            <Select id={`${d.id}-client`} defaultValue={d.clientCode ?? ""}>
              <option value="">Choose a client</option>
              {clients.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {shortName(c.name)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Type" htmlFor={`${d.id}-kind`}>
              <Select
                id={`${d.id}-kind`}
                defaultValue={KINDS.includes(d.kind) ? d.kind : "Other"}
              >
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            </Field>
            <Field label="Period" htmlFor={`${d.id}-period`}>
              <Select
                id={`${d.id}-period`}
                defaultValue={d.period ?? "Oct 2026"}
              >
                {[
                  "Nov 2026",
                  "Oct 2026",
                  "Sep 2026",
                  "Aug 2026",
                  "Q2 FY 2026-27",
                  "FY 2026-27",
                  "FY 2025-26",
                  "AY 2025-26",
                  "AY 2026-27",
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Attach to task" htmlFor={`${d.id}-task`}>
            <Select id={`${d.id}-task`} defaultValue="">
              <option value="">No task</option>
              {clientTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </InspectorSection>
      <InspectorActions>
        <SampleAction variant="primary" done="Filed to client folder (sample)">
          {d.status === "Linked" ? "Update" : "File it"}
        </SampleAction>
        <SampleAction done="Query sent on WhatsApp">Ask client</SampleAction>
      </InspectorActions>
    </>
  );
}
