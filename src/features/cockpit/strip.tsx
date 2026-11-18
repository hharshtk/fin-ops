import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  Globe,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  Mic,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { LoadBar } from "@/components/ui/misc";
import { DueIn } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import type {
  Client,
  DocumentItem,
  Invoice,
  StaffMember,
  Task,
} from "@/domain/types";
import { cn } from "@/lib/cn";
import { daysBetween, dayMonth, inrShort, time } from "@/lib/format";
import { shortName } from "@/lib/names";
import { TODAY } from "@/lib/today";

export function MyWorkList({
  tasks,
  clients,
}: {
  tasks: Task[];
  clients: Record<string, Client>;
}) {
  return (
    <ul className="divide-y divide-line">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/work?sel=${t.id}`}
            className="grid h-11 grid-cols-[3.75rem_1fr_auto] items-center gap-x-3 px-3 hover:bg-hover"
          >
            <DueIn due={t.due} className="text-sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{t.title}</span>
              <span className="block truncate text-xs text-ink-3">
                <span className="ident">{t.clientCode}</span> ·{" "}
                {clients[t.clientCode]
                  ? shortName(clients[t.clientCode]!.name)
                  : ""}
              </span>
            </span>
            <Status kind="task" value={t.status} className="text-xs" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TeamLoadList({ staff }: { staff: StaffMember[] }) {
  return (
    <ul className="px-3 py-1.5">
      {staff.map((s) => {
        const over = s.assignedHours > s.capacityHours;
        return (
          <li key={s.id}>
            <Link
              href={`/team?sel=${s.id}`}
              className="-mx-1 grid h-7 grid-cols-[6.5rem_1fr_4.25rem] items-center gap-x-3 rounded-[3px] px-1 hover:bg-hover"
            >
              <span className="truncate text-sm">{s.name.split(" ")[0]}</span>
              <LoadBar assigned={s.assignedHours} capacity={s.capacityHours} />
              <span
                className={cn(
                  "text-right text-sm figures",
                  over ? "font-semibold text-sig-red-ink" : "text-ink-2",
                )}
              >
                {s.assignedHours}/{s.capacityHours}h
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ReceivablesAgeing({ invoices }: { invoices: Invoice[] }) {
  const buckets = [
    { label: "Not yet due", min: -Infinity, max: 0 },
    { label: "1 to 30 days", min: 1, max: 30 },
    { label: "31 to 60 days", min: 31, max: 60 },
    { label: "61 to 90 days", min: 61, max: 90 },
    { label: "Over 90 days", min: 91, max: Infinity },
  ].map((b) => ({ ...b, amount: 0, count: 0 }));
  for (const inv of invoices) {
    const outstanding = inv.total - inv.received;
    if (outstanding <= 0 || inv.status === "Draft") continue;
    const age = daysBetween(inv.due, TODAY);
    const b = buckets.find((x) => age >= x.min && age <= x.max);
    if (b) {
      b.amount += outstanding;
      b.count++;
    }
  }
  const total = buckets.reduce((s, b) => s + b.amount, 0);
  const max = Math.max(...buckets.map((b) => b.amount), 1);
  return (
    <div className="px-3 py-2">
      <table className="w-full text-sm">
        <tbody>
          {buckets.map((b, i) => (
            <tr key={b.label}>
              <td className="h-7 pr-3 whitespace-nowrap text-ink-2">
                {b.label}
              </td>
              <td className="w-full">
                <div className="h-2 bg-sunken">
                  <div
                    className={cn(
                      "h-full",
                      i >= 2 ? "bg-sig-red" : "bg-navy/70",
                    )}
                    style={{ width: `${(b.amount / max) * 100}%` }}
                  />
                </div>
              </td>
              <td className="pl-3 text-right whitespace-nowrap figures">
                {inrShort(b.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="h-8 border-t border-line-strong pt-1 font-semibold">
              Outstanding
            </td>
            <td className="border-t border-line-strong" />
            <td className="border-t border-line-strong pt-1 pl-3 text-right font-semibold figures">
              {inrShort(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function docIcon(d: DocumentItem) {
  if (d.name.endsWith(".zip")) return FileArchive;
  if (/\.xlsx?$/.test(d.name)) return FileSpreadsheet;
  if (/\.(jpe?g|png)$/i.test(d.name)) return ImageIcon;
  if (d.name.startsWith("Voice")) return Mic;
  return FileText;
}

export const SOURCE_ICON = {
  WhatsApp: MessageCircle,
  Email: Mail,
  Upload,
  Portal: Globe,
} as const;

export function InboxList({ docs }: { docs: DocumentItem[] }) {
  return (
    <ul className="divide-y divide-line">
      {docs.map((d) => {
        const Icon = docIcon(d);
        const Source = SOURCE_ICON[d.source];
        const today = d.receivedAt.slice(0, 10) === TODAY;
        return (
          <li key={d.id}>
            <Link
              href={`/documents?sel=${d.id}`}
              className="grid h-11 grid-cols-[1rem_1fr_auto] items-center gap-x-3 px-3 hover:bg-hover"
            >
              <Icon
                aria-hidden
                className="size-4 text-ink-3"
                strokeWidth={1.75}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm">{d.name}</span>
                <span className="flex items-center gap-1 truncate text-xs text-ink-3">
                  <Source
                    aria-label={d.source}
                    className="size-3"
                    strokeWidth={2}
                  />
                  {d.clientCode ?? "Unknown"} · {d.kind}
                </span>
              </span>
              <span className="text-xs text-ink-3 figures">
                {today ? time(d.receivedAt) : dayMonth(d.receivedAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
