import { Check } from "lucide-react";
import Link from "next/link";
import { Signal } from "@/components/ui/signal";
import type { Filing } from "@/domain/types";
import { cn } from "@/lib/cn";
import { aspectFor } from "@/lib/signal";
import { TODAY } from "@/lib/today";

const MONTHS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];
const MONTH_NUM: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/** Recurring forms whose earlier months this FY are shown as filed history in the sample. */
const MONTHLY = new Set([
  "GSTR-1",
  "GSTR-3B",
  "Challan 281",
  "PF ECR",
  "ESI",
  "PT (MH)",
]);
const QRMP_MONTHLY = new Set(["IFF", "PMT-06"]);
const QUARTERLY = new Set(["24Q", "26Q", "Form 16A", "CMP-08"]);
const ORDER = ["GST", "TDS", "Payroll", "ROC", "Income tax", "Engagement"];

type Cell =
  { kind: "filing"; filing: Filing } | { kind: "history" } | { kind: "none" };

/** Column for a period label: month index 0..11 in the Indian FY, or 12 for annual. */
function column(period: string): number | null {
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(period);
  if (m) {
    const n = MONTH_NUM[m[1]!]!;
    const fyStart = n >= 4 ? Number(m[2]) : Number(m[2]) - 1;
    if (fyStart !== 2026) return null;
    return (n + 8) % 12;
  }
  const q = /^Q(\d) FY 2026-27$/.exec(period);
  if (q) return Number(q[1]) * 3 - 1;
  if (/^(FY|AY) /.test(period)) return 12;
  return null;
}

/**
 * The client's year on one screen: every recurring form against the months of FY 2026-27, with
 * annual returns in the last column. Open items show their signal; filed ones a tick.
 */
export function ComplianceMatrix({
  filings,
  clientCode,
}: {
  filings: Filing[];
  clientCode: string;
}) {
  const rows = new Map<string, { regime: string; cells: Cell[] }>();
  for (const f of filings) {
    const col = column(f.period);
    if (col === null) continue;
    const key =
      /^Q\d/.test(f.period) && (f.form === "GSTR-1" || f.form === "GSTR-3B")
        ? `${f.form} (quarterly)`
        : f.form;
    if (!rows.has(key))
      rows.set(key, {
        regime: f.regime,
        cells: Array.from({ length: 13 }, () => ({ kind: "none" }) as Cell),
      });
    rows.get(key)!.cells[col] = { kind: "filing", filing: f };
  }
  // Earlier months of recurring forms: filed history.
  for (const [key, row] of rows) {
    const firstCol = row.cells.findIndex((c) => c.kind === "filing");
    if (firstCol <= 0) continue;
    for (let i = 0; i < firstCol; i++) {
      const monthly = MONTHLY.has(key);
      const qrmp = QRMP_MONTHLY.has(key) && i % 3 !== 2;
      const quarterly =
        (QUARTERLY.has(key) || key.endsWith("(quarterly)")) && i % 3 === 2;
      if (monthly || qrmp || quarterly) row.cells[i] = { kind: "history" };
    }
  }
  const sorted = [...rows.entries()].sort(
    (a, b) =>
      ORDER.indexOf(a[1].regime) - ORDER.indexOf(b[1].regime) ||
      a[0].localeCompare(b[0]),
  );
  const currentCol = (Number(TODAY.slice(5, 7)) + 8) % 12;

  return (
    <div className="scroll-thin overflow-x-auto">
      <table
        className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm"
        aria-label="Compliance matrix, FY 2026-27"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-[1] h-7 border-b border-line bg-sunken px-3 text-left caps text-ink-3"
            >
              Form
            </th>
            {[...MONTHS, "Annual"].map((m, i) => (
              <th
                key={m}
                scope="col"
                className={cn(
                  "h-7 w-10 border-b border-line bg-sunken px-1 text-center caps",
                  i === currentCol ? "text-ink" : "text-ink-3",
                  i === 12 && "border-l border-line",
                )}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(([form, row], ri) => {
            const regimeStart =
              ri === 0 || sorted[ri - 1]![1].regime !== row.regime;
            return (
              <tr key={form}>
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-[1] h-8 border-b border-line bg-surface px-3 text-left font-normal whitespace-nowrap",
                    regimeStart && ri > 0 && "border-t-2 border-t-line-strong",
                  )}
                >
                  <span className="font-medium">{form}</span>
                  {regimeStart && (
                    <span className="ml-2 text-xs text-ink-3">
                      {row.regime}
                    </span>
                  )}
                </th>
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "h-8 border-b border-line px-1 text-center",
                      ci === currentCol && "bg-select/50",
                      ci === 12 && "border-l border-line",
                      regimeStart &&
                        ri > 0 &&
                        "border-t-2 border-t-line-strong",
                    )}
                  >
                    {cell.kind === "history" ? (
                      <Check
                        aria-label="Filed"
                        className="mx-auto size-3.5 text-ink-4"
                        strokeWidth={2}
                      />
                    ) : cell.kind === "filing" ? (
                      <Link
                        href={`/compliance?status=all&q=${clientCode}&sel=${cell.filing.id}`}
                        title={`${cell.filing.form} ${cell.filing.period}: ${cell.filing.status}`}
                        className="inline-grid size-6 place-items-center rounded-[3px] hover:bg-hover"
                      >
                        {cell.filing.status === "Filed" ? (
                          <Check
                            aria-label="Filed"
                            className="size-3.5 text-sig-green-ink"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <Signal
                            aspect={aspectFor(cell.filing.due)}
                            label={`${cell.filing.status}, due ${cell.filing.due}`}
                          />
                        )}
                      </Link>
                    ) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Check
            aria-hidden
            className="size-3 text-sig-green-ink"
            strokeWidth={2.5}
          />{" "}
          Filed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check aria-hidden className="size-3 text-ink-4" /> Filed earlier this
          FY
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Signal aspect="red" /> Overdue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Signal aspect="yellow" /> Due in 3 days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Signal aspect="double-yellow" /> Due in 7 days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Signal aspect="green" /> Scheduled
        </span>
      </p>
    </div>
  );
}
