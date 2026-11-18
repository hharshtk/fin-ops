import { Check } from "lucide-react";
import Link from "next/link";
import { Signal } from "@/components/ui/signal";
import type { DueBatch } from "@/domain/types";
import { cn } from "@/lib/cn";
import { addDays } from "@/lib/format";
import { aspectFor } from "@/lib/signal";
import { TODAY } from "@/lib/today";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month of due dates. Each day lists its batches with open counts; Sundays print in red. */
export function MonthCalendar({
  month,
  batches,
}: {
  month: string;
  batches: DueBatch[];
}) {
  const first = `${month}-01`;
  const startDow = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const gridStart = addDays(first, -startDow);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const trimmed = days.slice(0, days[35]?.startsWith(month) ? 42 : 35);
  const byDay = new Map<string, DueBatch[]>();
  for (const b of batches) byDay.set(b.due, [...(byDay.get(b.due) ?? []), b]);

  return (
    <div className="scroll-thin overflow-x-auto">
      <div className="grid min-w-[56rem] grid-cols-7 gap-px bg-line">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "bg-sunken px-2 py-1.5 caps",
              i === 6 ? "text-sig-red-ink" : "text-ink-3",
            )}
          >
            {d}
          </div>
        ))}
        {trimmed.map((day, i) => {
          const inMonth = day.startsWith(month);
          const items = byDay.get(day) ?? [];
          const isToday = day === TODAY;
          const sunday = i % 7 === 6;
          return (
            <div
              key={day}
              className={cn(
                "min-h-[7.25rem] bg-surface p-1.5",
                !inMonth && "bg-ground",
                isToday && "ring-2 ring-navy ring-inset",
              )}
            >
              <div className="mb-1 flex items-baseline justify-between px-0.5">
                <span
                  className={cn(
                    "text-lg leading-none font-bold condensed tabular-nums",
                    !inMonth
                      ? "text-ink-4"
                      : sunday
                        ? "text-sig-red-ink"
                        : "text-ink",
                  )}
                >
                  {Number(day.slice(8, 10))}
                </span>
                {isToday && (
                  <span className="text-2xs font-semibold text-navy uppercase">
                    Today
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-px">
                {items.map((b) => {
                  const open = b.total - b.filed;
                  return (
                    <li key={b.key}>
                      <Link
                        href={`/compliance?form=${encodeURIComponent(b.form)}&period=${encodeURIComponent(b.period)}`}
                        className="flex h-6 items-center gap-1.5 rounded-[2px] px-1 text-xs hover:bg-hover"
                        title={`${b.form} ${b.period}: ${open} open of ${b.total}`}
                      >
                        <Signal
                          aspect={aspectFor(b.due, open === 0)}
                          className="scale-90"
                        />
                        <span className="truncate font-medium">{b.form}</span>
                        <span
                          className={cn(
                            "ml-auto figures",
                            open ? "text-ink-2" : "text-sig-green-ink",
                          )}
                        >
                          {open ? (
                            open
                          ) : (
                            <Check
                              aria-label="All filed"
                              className="size-3"
                              strokeWidth={2.5}
                            />
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
