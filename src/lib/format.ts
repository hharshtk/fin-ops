/**
 * India-first formatting. Dates are ISO strings (YYYY-MM-DD) treated as calendar dates in IST;
 * they are formatted from their parts so the server's timezone never shifts a day.
 */

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const num2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹12,34,567 (or ₹12,34,567.00 with paise). */
export function inr(value: number, opts?: { paise?: boolean }): string {
  return (opts?.paise ? inr2 : inr0).format(value);
}

/** Ledger amount without symbol: 12,34,567.00 */
export function amount(value: number): string {
  return num2.format(value);
}

/** Integer with Indian grouping: 1,23,456 */
export function num(value: number): string {
  return num0.format(value);
}

/** Lakh/crore notation for summaries: ₹3.84 L, ₹1.26 Cr */
export function inrShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)} L`;
  return `${sign}${inr0.format(abs)}`;
}

function trim(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

function utc(iso: string): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 17/11/2026 */
export function date(iso: string): string {
  const [y, m, d] = parts(iso);
  return `${pad(d)}/${pad(m)}/${y}`;
}

/** 17/11 */
export function dayMonth(iso: string): string {
  const [, m, d] = parts(iso);
  return `${pad(d)}/${pad(m)}`;
}

/** Tue */
export function weekday(iso: string): string {
  return WEEKDAYS[new Date(utc(iso)).getUTCDay()] ?? "";
}

/** Nov 2026 */
export function monthLabel(iso: string): string {
  const [y, m] = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Nov */
export function monthShort(month: number): string {
  return MONTHS[month - 1] ?? "";
}

/** 10:42 from an ISO datetime carrying an IST offset. */
export function time(isoDateTime: string): string {
  return isoDateTime.slice(11, 16);
}

/** 17/11/2026 10:42 */
export function dateTime(isoDateTime: string): string {
  return `${date(isoDateTime)} ${time(isoDateTime)}`;
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const t = new Date(utc(iso) + days * 86_400_000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Indian financial year label for a date: FY 2026-27 */
export function fyLabel(iso: string): string {
  const [y, m] = parts(iso);
  const start = m >= 4 ? y : y - 1;
  return `FY ${start}-${String(start + 1).slice(2)}`;
}

/** Quarter within the Indian FY: Q1 is Apr to Jun. */
export function fyQuarter(iso: string): number {
  const [, m] = parts(iso);
  return Math.floor(((m + 8) % 12) / 3) + 1;
}

/** Whole-number percentage, 0 when the whole is empty. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
