import type {
  DocumentStatus,
  FilingStatus,
  InvoiceStatus,
  TaskStatus,
} from "@/domain/types";
import { cn } from "@/lib/cn";

type Tone = "green" | "yellow" | "red" | "navy" | "neutral" | "muted";

const TONE: Record<Tone, string> = {
  green: "text-sig-green-ink",
  yellow: "text-sig-yellow-ink",
  red: "text-sig-red-ink",
  navy: "text-navy font-medium",
  neutral: "text-ink-2",
  muted: "text-ink-3",
};

const DOT: Record<Tone, string> = {
  green: "bg-sig-green",
  yellow: "bg-sig-yellow",
  red: "bg-sig-red",
  navy: "bg-navy",
  neutral: "bg-ink-4",
  muted: "bg-line-strong",
};

const FILING: Record<FilingStatus, Tone> = {
  Filed: "green",
  "Ready to file": "navy",
  "In review": "neutral",
  "In preparation": "neutral",
  "Awaiting data": "yellow",
  "Not started": "muted",
};

const TASK: Record<TaskStatus, Tone> = {
  Done: "green",
  "In review": "navy",
  "In progress": "neutral",
  "Waiting on client": "yellow",
  "To do": "muted",
};

const INVOICE: Record<InvoiceStatus, Tone> = {
  Paid: "green",
  "Part paid": "neutral",
  Sent: "neutral",
  Overdue: "red",
  Draft: "muted",
};

const DOCUMENT: Record<DocumentStatus, Tone> = {
  Linked: "green",
  "To classify": "navy",
  "Query raised": "yellow",
};

/** Status as quiet text with a small square marker; colour is reserved for states that need action. */
export function Status({
  kind,
  value,
  className,
}: {
  kind: "filing" | "task" | "invoice" | "document";
  value: string;
  className?: string;
}) {
  const map: Record<string, Tone> =
    kind === "filing"
      ? FILING
      : kind === "task"
        ? TASK
        : kind === "invoice"
          ? INVOICE
          : DOCUMENT;
  const tone = map[value] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-[1px]", DOT[tone])}
      />
      {value}
    </span>
  );
}
