import type { Filing, StaffMember, Task } from "@/domain/types";
import { daysBetween } from "@/lib/format";
import { TODAY } from "@/lib/today";

export interface TeamRow {
  s: StaffMember;
  open: Task[];
  reviews: Task[];
  lateFilings: Filing[];
  weekFilings: Filing[];
}

/** Each person's open work this week: tasks, reviews, late and near-due filings. */
export function teamRows(
  staff: StaffMember[],
  tasks: Task[],
  filings: Filing[],
): TeamRow[] {
  return staff.map((s) => {
    const open = tasks.filter(
      (t) => t.assigneeId === s.id && t.status !== "Done",
    );
    const reviews = tasks.filter(
      (t) => t.reviewerId === s.id && t.status === "In review",
    );
    const lateFilings = filings.filter(
      (f) => f.assigneeId === s.id && f.status !== "Filed" && f.due < TODAY,
    );
    const weekFilings = filings.filter((f) => {
      const d = daysBetween(TODAY, f.due);
      return f.assigneeId === s.id && f.status !== "Filed" && d >= 0 && d <= 7;
    });
    return { s, open, reviews, lateFilings, weekFilings };
  });
}

/** Default person for the inspector: the first one over capacity. */
export function defaultPerson(rows: TeamRow[]): TeamRow | undefined {
  return rows.find((r) => r.s.assignedHours > r.s.capacityHours) ?? rows[0];
}
