import { DueIn, Signal } from "@/components/ui/signal";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { DueBatch } from "@/domain/types";
import { cn } from "@/lib/cn";
import { dayMonth, weekday } from "@/lib/format";
import { aspectFor } from "@/lib/signal";
import { TODAY } from "@/lib/today";

function Count({ value, tone }: { value: number; tone?: "yellow" }) {
  if (value === 0) return <span className="text-ink-4">·</span>;
  return (
    <span
      className={cn(tone === "yellow" && "font-semibold text-sig-yellow-ink")}
    >
      {value}
    </span>
  );
}

/** Columns that drop out on phones; the signal, date, form and progress stay. */
const SECONDARY = "max-md:hidden";

/**
 * The Due Board: filings grouped by due date and set in timetable column rhythm. The date prints
 * once per group, like a departure time.
 */
export function DueBoard({
  batches,
  selected,
  hrefFor,
}: {
  batches: DueBatch[];
  selected?: string;
  hrefFor: (key: string) => string;
}) {
  const groups = new Map<string, DueBatch[]>();
  for (const b of batches) groups.set(b.due, [...(groups.get(b.due) ?? []), b]);

  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Due Board" className="md:min-w-[46rem]">
        <thead>
          <tr>
            <Th align="center" width="2.5rem">
              <span className="sr-only">Signal</span>
            </Th>
            <Th width="6.25rem">Due</Th>
            <Th>Form</Th>
            <Th className={SECONDARY}>Period</Th>
            <Th align="right" width="4rem" className={SECONDARY}>
              Clients
            </Th>
            <Th align="right" width="4.5rem">
              Filed
            </Th>
            <Th align="right" width="3.75rem" className={SECONDARY}>
              Ready
            </Th>
            <Th align="right" width="3.75rem" className={SECONDARY}>
              Review
            </Th>
            <Th align="right" width="3.75rem" className={SECONDARY}>
              Prep
            </Th>
            <Th align="right" width="4.75rem" className={SECONDARY}>
              Awaiting
            </Th>
            <Th align="right" width="5.25rem">
              Late / due
            </Th>
          </tr>
        </thead>
        {[...groups.entries()].map(([due, rows]) => {
          const late = due < TODAY;
          return (
            <tbody key={due}>
              {rows.map((b, i) => {
                const open = b.total - b.filed;
                return (
                  <Tr key={b.key}>
                    <Td align="center">
                      <Signal aspect={aspectFor(b.due, open === 0)} />
                    </Td>
                    <Td>
                      {i === 0 && (
                        <span className="flex items-baseline gap-1.5">
                          <span
                            className={cn(
                              "text-base font-bold condensed tabular-nums",
                              late ? "text-sig-red-ink" : "text-ink",
                            )}
                          >
                            {dayMonth(due)}
                          </span>
                          <span className="text-xs text-ink-3">
                            {weekday(due)}
                          </span>
                        </span>
                      )}
                    </Td>
                    <Td className="max-md:max-w-[9rem] max-md:truncate">
                      <RowLink
                        href={hrefFor(b.key)}
                        selected={b.key === selected}
                        className="font-semibold"
                      >
                        {b.form}
                      </RowLink>
                      <span className="ml-1.5 text-xs text-ink-3 md:hidden">
                        {b.period}
                      </span>
                      <span className="ml-1.5 text-xs text-ink-3 max-2xl:hidden">
                        {b.regime}
                      </span>
                    </Td>
                    <Td className={cn("text-ink-2", SECONDARY)}>{b.period}</Td>
                    <Td align="right" className={SECONDARY}>
                      {b.total}
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          open === 0 && "font-semibold text-sig-green-ink",
                        )}
                      >
                        {b.filed}
                      </span>
                      <span className="text-ink-4">/{b.total}</span>
                    </Td>
                    <Td align="right" className={SECONDARY}>
                      <Count value={b.ready} />
                    </Td>
                    <Td align="right" className={SECONDARY}>
                      <Count value={b.review} />
                    </Td>
                    <Td align="right" className={SECONDARY}>
                      <Count value={b.inPrep + b.notStarted} />
                    </Td>
                    <Td align="right" className={SECONDARY}>
                      <Count value={b.awaiting} tone="yellow" />
                    </Td>
                    <Td align="right">
                      <DueIn due={b.due} done={open === 0} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          );
        })}
      </Table>
    </div>
  );
}

const KEY: {
  aspect: "red" | "yellow" | "double-yellow" | "green";
  label: string;
}[] = [
  { aspect: "red", label: "overdue" },
  { aspect: "yellow", label: "3 days" },
  { aspect: "double-yellow", label: "7 days" },
  { aspect: "green", label: "clear" },
];

/** Panel meta for the Due Board: scope, batch count, and the key to the four signal aspects. */
export function DueBoardMeta({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-3">
      <span>Overdue and next 14 days · {count} batches</span>
      <span
        aria-label="Signal key"
        className="flex items-center gap-2.5 max-lg:hidden"
      >
        {KEY.map((k) => (
          <span
            key={k.aspect}
            className="inline-flex items-center gap-1 text-xs"
          >
            <Signal aspect={k.aspect} />
            {k.label}
          </span>
        ))}
      </span>
    </span>
  );
}
