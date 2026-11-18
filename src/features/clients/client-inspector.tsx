import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import {
  Facts,
  InspectorActions,
  InspectorHead,
  InspectorSection,
} from "@/components/ui/inspector";
import { SampleAction } from "@/components/ui/sample-action";
import { DueIn, Signal } from "@/components/ui/signal";
import type { Aspect, Client, Filing, StaffMember } from "@/domain/types";
import { date, inr } from "@/lib/format";
import { aspectFor } from "@/lib/signal";

export function regLabel(c: Client): string {
  return c.constitution === "LLP" ? "LLPIN" : "CIN";
}

export function ContactBlock({ client: c }: { client: Client }) {
  return (
    <div className="text-sm">
      <p className="font-medium">{c.contact.name}</p>
      <p className="text-ink-3">{c.contact.role}</p>
      <ul className="mt-2 flex flex-col gap-1">
        <li className="flex items-center gap-2">
          <Phone aria-hidden className="size-3.5 text-ink-3" />
          <span className="figures">{c.contact.phone}</span>
        </li>
        <li className="flex items-center gap-2">
          <Mail aria-hidden className="size-3.5 text-ink-3" />
          <span className="truncate">{c.contact.email}</span>
        </li>
      </ul>
    </div>
  );
}

export function ClientInspector({
  client: c,
  aspect,
  filings,
  outstanding,
  staff,
}: {
  client: Client;
  aspect: Aspect;
  filings: Filing[];
  outstanding: number;
  staff: Record<string, StaffMember>;
}) {
  const open = filings
    .filter((f) => f.status !== "Filed")
    .sort((a, b) => a.due.localeCompare(b.due));
  return (
    <>
      <InspectorHead
        aside={<Signal aspect={aspect} />}
        title={c.name}
        meta={
          <>
            <span className="ident">{c.code}</span> · {c.constitution} ·{" "}
            {c.city}
          </>
        }
      />
      <InspectorActions>
        <ButtonLink href={`/clients/${c.code}`} variant="primary">
          Open workspace
          <ArrowUpRight />
        </ButtonLink>
        <SampleAction done="Chat opened (sample)">
          <MessageCircle />
          WhatsApp
        </SampleAction>
      </InspectorActions>
      <InspectorSection title="Identifiers">
        <Facts
          items={[
            [
              "PAN",
              <span key="p" className="ident">
                {c.pan}
              </span>,
            ],
            ...(c.gstin
              ? ([
                  [
                    "GSTIN",
                    <span key="g" className="ident">
                      {c.gstin}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ...(c.tan
              ? ([
                  [
                    "TAN",
                    <span key="t" className="ident">
                      {c.tan}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ...(c.regNo
              ? ([
                  [
                    regLabel(c),
                    <span key="r" className="ident break-all">
                      {c.regNo}
                    </span>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ["GST scheme", c.gstScheme],
          ]}
        />
      </InspectorSection>
      <InspectorSection title={`Open filings (${open.length})`}>
        {open.length === 0 ? (
          <p className="text-sm text-ink-2">All filings up to date.</p>
        ) : (
          <ul className="-mx-1 flex flex-col">
            {open.slice(0, 6).map((f) => (
              <li key={f.id}>
                <Link
                  href={`/compliance?status=all&q=${c.code}&sel=${f.id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 rounded-[3px] px-1 py-1 hover:bg-hover"
                >
                  <Signal aspect={aspectFor(f.due)} />
                  <span className="truncate text-sm">
                    {f.form} <span className="text-ink-3">{f.period}</span>
                  </span>
                  <DueIn due={f.due} className="text-sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </InspectorSection>
      <InspectorSection title="Engagement">
        <Facts
          items={[
            ["Partner", staff[c.partnerId]?.name ?? "—"],
            ["Manager", staff[c.managerId]?.name ?? "—"],
            ["Services", c.services.join(", ")],
            [
              "Retainer",
              <span key="f" className="figures">
                {inr(c.feeAnnual)} a year
              </span>,
            ],
            [
              "Fees due",
              <span key="o" className="figures">
                {outstanding ? inr(outstanding) : "Nil"}
              </span>,
            ],
            ["Client since", date(c.since)],
          ]}
        />
      </InspectorSection>
      <InspectorSection title="Contact">
        <ContactBlock client={c} />
      </InspectorSection>
    </>
  );
}
