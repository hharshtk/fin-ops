import type { Aspect, ISODate } from "@/domain/types";
import { daysBetween } from "./format";
import { TODAY } from "./today";

/** The ramp used on every screen: overdue, within 3 days, within 7 days, clear. */
export function aspectFor(
  due: ISODate,
  done = false,
  today: ISODate = TODAY,
): Aspect {
  if (done) return "green";
  const d = daysBetween(today, due);
  if (d < 0) return "red";
  if (d <= 3) return "yellow";
  if (d <= 7) return "double-yellow";
  return "green";
}

export const ASPECT_LABEL: Record<Aspect, string> = {
  red: "Overdue",
  yellow: "Due within 3 days",
  "double-yellow": "Due within 7 days",
  green: "Clear",
  none: "Not applicable",
};

export const ASPECT_RANK: Record<Aspect, number> = {
  red: 0,
  yellow: 1,
  "double-yellow": 2,
  green: 3,
  none: 4,
};

export function worstAspect(aspects: Aspect[]): Aspect {
  return aspects.reduce<Aspect>(
    (worst, a) => (ASPECT_RANK[a] < ASPECT_RANK[worst] ? a : worst),
    "none",
  );
}

/** "6d late", "Today", "Tomorrow", "in 5d" with the tone that goes with it. */
export function dueText(
  due: ISODate,
  today: ISODate = TODAY,
): { text: string; tone: "red" | "yellow" | "neutral" } {
  const d = daysBetween(today, due);
  if (d < 0) return { text: `${-d}d late`, tone: "red" };
  if (d === 0) return { text: "Today", tone: "yellow" };
  if (d === 1) return { text: "Tomorrow", tone: "yellow" };
  if (d <= 3) return { text: `in ${d}d`, tone: "yellow" };
  return { text: `in ${d}d`, tone: "neutral" };
}
