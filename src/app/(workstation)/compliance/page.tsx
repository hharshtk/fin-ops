import {
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DefaultPanelGate } from "@/components/ui/default-panel-gate";
import { Empty, TableSkeleton } from "@/components/ui/misc";
import { PageHeader, Toolbar } from "@/components/ui/page-header";
import { SearchField, SearchFieldFallback } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import type { Filing, Regime } from "@/domain/types";
import {
  getClients,
  getCurrentUser,
  getFilings,
  getStaff,
  groupBatches,
} from "@/data/queries";
import { CompliancePanel } from "@/features/compliance/panel";
import { MonthCalendar } from "@/features/compliance/month-calendar";
import { Register } from "@/features/compliance/register";
import { daysBetween, monthLabel } from "@/lib/format";
import { byCode, byId } from "@/lib/names";
import { TODAY } from "@/lib/today";
import { hrefWith, inspectHref, param, type SearchParams } from "@/lib/url";

export const metadata = { title: "Compliance" };

const REGIMES: (Regime | "All")[] = [
  "All",
  "GST",
  "Income tax",
  "TDS",
  "ROC",
  "Payroll",
  "Engagement",
];

const STATUS: { key: string; label: string; test: (f: Filing) => boolean }[] = [
  { key: "", label: "Open", test: (f) => f.status !== "Filed" },
  {
    key: "overdue",
    label: "Overdue",
    test: (f) => f.status !== "Filed" && f.due < TODAY,
  },
  {
    key: "due",
    label: "3 days",
    test: (f) =>
      f.status !== "Filed" &&
      daysBetween(TODAY, f.due) >= 0 &&
      daysBetween(TODAY, f.due) <= 3,
  },
  {
    key: "week",
    label: "7 days",
    test: (f) =>
      f.status !== "Filed" &&
      daysBetween(TODAY, f.due) >= 0 &&
      daysBetween(TODAY, f.due) <= 7,
  },
  {
    key: "awaiting",
    label: "Awaiting client",
    test: (f) => f.status === "Awaiting data",
  },
  { key: "filed", label: "Filed", test: (f) => f.status === "Filed" },
  { key: "all", label: "All", test: () => true },
];

export default function CompliancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Compliance" />
          <Toolbar>
            <SearchFieldFallback
              placeholder="Filter by client, PAN or form"
              className="w-64"
            />
          </Toolbar>
          <TableSkeleton rows={14} cols={8} />
        </>
      }
    >
      <Compliance params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Compliance({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: inspectId }, sp] = await Promise.all([params, searchParams]);
  const regime = param(sp, "regime") ?? "All";
  const statusKey = param(sp, "status") ?? "";
  const view = param(sp, "view") === "calendar" ? "calendar" : "register";
  const who = param(sp, "who");
  const form = param(sp, "form");
  const period = param(sp, "period");
  const q = (param(sp, "q") ?? "").toLowerCase();
  const month = /^\d{4}-\d{2}$/.test(param(sp, "month") ?? "")
    ? param(sp, "month")!
    : TODAY.slice(0, 7);
  const selParam = param(sp, "sel");

  const [filings, clientList, staffList, me] = await Promise.all([
    getFilings(),
    getClients(),
    getStaff(),
    getCurrentUser(),
  ]);
  const clients = byCode(clientList);
  const staff = byId(staffList);
  const whoId = who === "me" ? me.id : who;

  const base = filings.filter((f) => {
    if (regime !== "All" && f.regime !== regime) return false;
    if (form && f.form !== form) return false;
    if (period && f.period !== period) return false;
    if (whoId && f.assigneeId !== whoId && f.reviewerId !== whoId) return false;
    if (q) {
      const c = clients[f.clientCode];
      const hay =
        `${f.clientCode} ${c?.name ?? ""} ${c?.pan ?? ""} ${c?.gstin ?? ""} ${f.form} ${f.period}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const status = STATUS.find((s) => s.key === statusKey) ?? STATUS[0]!;
  const rows = base
    .filter(status.test)
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due) ||
        a.form.localeCompare(b.form) ||
        a.clientCode.localeCompare(b.clientCode),
    );

  const regimeCount = (r: string) =>
    filings.filter(
      (f) => (r === "All" || f.regime === r) && f.status !== "Filed",
    ).length;

  // A row selected through the path renders in the panel slot; otherwise this page shows
  // its own default inspector (`?sel=` from another module, or the first row).
  const selectedId =
    inspectId ??
    (selParam && filings.some((f) => f.id === selParam) ? selParam : undefined);
  const shownId = selectedId ?? (view === "register" ? rows[0]?.id : undefined);
  const path = "/compliance";

  const [y, m] = month.split("-").map(Number) as [number, number];
  const prevMonth = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
  const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Compliance"
          meta={
            view === "register"
              ? `${rows.length} filings`
              : monthLabel(`${month}-01`)
          }
          actions={
            <>
              <Segmented
                label="People"
                items={[
                  {
                    label: "Everyone",
                    href: hrefWith(path, sp, { who: null }),
                    active: !who,
                  },
                  {
                    label: "Mine",
                    href: hrefWith(path, sp, { who: "me" }),
                    active: who === "me",
                  },
                ]}
              />
              <Segmented
                label="View"
                items={[
                  {
                    label: (
                      <>
                        <LayoutList aria-hidden />
                        Register
                      </>
                    ),
                    href: hrefWith(path, sp, { view: null, month: null }),
                    active: view === "register",
                  },
                  {
                    label: (
                      <>
                        <CalendarDays aria-hidden />
                        Calendar
                      </>
                    ),
                    href: hrefWith(path, sp, { view: "calendar" }),
                    active: view === "calendar",
                  },
                ]}
              />
            </>
          }
        />
        <div className="border-b border-line bg-surface px-3 sm:px-4">
          <Tabs
            label="Regime"
            items={REGIMES.map((r) => ({
              label: r === "Engagement" ? "Engagements" : r,
              href: hrefWith(path, sp, { regime: r === "All" ? null : r }),
              active: regime === r,
              count: regimeCount(r),
            }))}
          />
        </div>
        <Toolbar>
          {view === "register" && (
            <Segmented
              label="Status"
              items={STATUS.map((s) => ({
                label: s.label,
                href: hrefWith(path, sp, { status: s.key || null }),
                active: status.key === s.key,
              }))}
              className="max-w-full overflow-x-auto"
            />
          )}
          {view === "calendar" && (
            <span className="text-sm text-ink-2">
              Due dates for {monthLabel(`${month}-01`)}
            </span>
          )}
          {(form || period || (who && who !== "me")) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                form && { k: "form", label: form },
                period && { k: "period", label: period },
                who &&
                  who !== "me" && { k: "who", label: staff[who]?.name ?? who },
              ]
                .filter((x): x is { k: string; label: string } => Boolean(x))
                .map((chip) => (
                  <Link
                    key={chip.k}
                    href={hrefWith(path, sp, { [chip.k]: null })}
                    className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-select px-2 text-sm text-ink hover:bg-line"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <X aria-hidden className="size-3 text-ink-3" />
                  </Link>
                ))}
            </div>
          )}
          <SearchField
            placeholder="Filter by client, PAN or form"
            className="w-full sm:ml-auto sm:w-64"
          />
        </Toolbar>

        {view === "calendar" ? (
          <div className="bg-surface">
            <div className="flex h-10 items-center gap-2 border-b border-line px-3 sm:px-4">
              <ButtonLink
                href={hrefWith(path, sp, { month: prevMonth })}
                variant="ghost"
                aria-label="Previous month"
                scroll={false}
              >
                <ChevronLeft />
              </ButtonLink>
              <span className="w-24 text-center text-sm font-semibold">
                {monthLabel(`${month}-01`)}
              </span>
              <ButtonLink
                href={hrefWith(path, sp, { month: nextMonth })}
                variant="ghost"
                aria-label="Next month"
                scroll={false}
              >
                <ChevronRight />
              </ButtonLink>
              <ButtonLink
                href={hrefWith(path, sp, { month: null })}
                variant="ghost"
                scroll={false}
              >
                Today
              </ButtonLink>
              <span className="ml-auto text-xs text-ink-3 max-sm:hidden">
                Count shows filings still open. Click a form to open it in the
                register.
              </span>
            </div>
            <MonthCalendar month={month} batches={groupBatches(base)} />
          </div>
        ) : rows.length > 0 ? (
          <Register
            filings={rows}
            clients={clients}
            staff={staff}
            selected={shownId}
            hrefFor={(id) => inspectHref(path, id, sp)}
          />
        ) : (
          <Empty
            title={
              statusKey === "overdue"
                ? "Nothing overdue for this filter"
                : "No filings match these filters"
            }
            action={
              <ButtonLink href={path} variant="secondary">
                Clear filters
              </ButtonLink>
            }
          >
            Filings are created from each client&apos;s registrations: GST
            scheme, TAN, constitution and payroll. Widen the regime or status to
            see more.
          </Empty>
        )}
      </div>

      {view === "register" && !inspectId && (
        <DefaultPanelGate>
          <CompliancePanel
            id={shownId}
            sp={sp}
            explicit={Boolean(selectedId)}
          />
        </DefaultPanelGate>
      )}
    </div>
  );
}
