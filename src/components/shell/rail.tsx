import { Bookmark } from "lucide-react";
import Link from "next/link";
import {
  getCurrentUser,
  getDocuments,
  getFilings,
  getFirm,
  getInvoices,
  getTasks,
} from "@/data/queries";
import { TODAY } from "@/lib/today";
import { NAV, SAVED_VIEWS } from "./nav";
import { NavIcon } from "./nav-icon";
import { RailLink } from "./rail-link";

export async function railCounts() {
  const [filings, tasks, docs, invoices, me] = await Promise.all([
    getFilings(),
    getTasks(),
    getDocuments(),
    getInvoices(),
    getCurrentUser(),
  ]);
  return {
    "/compliance": {
      count: filings.filter((f) => f.status !== "Filed" && f.due < TODAY)
        .length,
      tone: "red" as const,
    },
    "/work": {
      count: tasks.filter(
        (t) =>
          t.status !== "Done" &&
          (t.assigneeId === me.id || t.reviewerId === me.id),
      ).length,
      tone: "neutral" as const,
    },
    "/documents": {
      count: docs.filter((d) => d.status === "To classify").length,
      tone: "neutral" as const,
    },
    "/billing": {
      count: invoices.filter((i) => i.status === "Overdue").length,
      tone: "red" as const,
    },
  } as Record<string, { count: number; tone: "red" | "neutral" }>;
}

/** Brand mark: the signal head, showing clear. */
export function BrandMark() {
  return (
    <span aria-hidden className="signal signal-lg" data-aspect="green">
      <i />
      <i />
    </span>
  );
}

export async function Rail() {
  const [counts, firm, me] = await Promise.all([
    railCounts(),
    getFirm(),
    getCurrentUser(),
  ]);
  return (
    <div className="flex h-full flex-col bg-rail text-rail-ink">
      <Link
        href="/"
        className="flex h-10 shrink-0 items-center gap-2.5 border-b border-rail-line px-3 max-[90rem]:justify-center max-[90rem]:px-0"
      >
        <BrandMark />
        <span className="leading-none max-[90rem]:sr-only">
          <span className="block text-md font-bold tracking-tight">
            Fin Ops
          </span>
        </span>
      </Link>

      <nav
        aria-label="Modules"
        className="flex flex-1 scroll-thin flex-col gap-4 overflow-y-auto px-2 py-3 max-[90rem]:px-1.5"
      >
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="mb-1 px-2 caps text-rail-ink-2/80 max-[90rem]:sr-only">
              {group.group}
            </p>
            <ul className="flex flex-col gap-px">
              {group.items.map((item) => {
                const c = counts[item.href];
                return (
                  <li key={item.href}>
                    <RailLink
                      href={item.href}
                      label={item.label}
                      chord={item.chord}
                      icon={<NavIcon name={item.icon} />}
                      count={c?.count}
                      countTone={c?.tone}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="max-[90rem]:hidden">
          <p className="mb-1 flex items-center gap-1.5 px-2 caps text-rail-ink-2/80">
            <Bookmark aria-hidden className="size-3" strokeWidth={2} />
            Saved views
          </p>
          <ul className="flex flex-col gap-px">
            {SAVED_VIEWS.map((v) => (
              <li key={v.href}>
                <Link
                  href={v.href}
                  className="flex h-7 items-center rounded-[3px] px-2 text-sm text-rail-ink-2 transition-colors duration-150 hover:bg-rail-raised/60 hover:text-rail-ink"
                >
                  <span className="truncate">{v.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-rail-line px-3 py-2.5 max-[90rem]:justify-center max-[90rem]:px-0">
        <span
          title={`${me.name}, ${me.role}`}
          className="grid size-7 shrink-0 place-items-center rounded-full bg-rail-raised text-2xs font-semibold text-rail-ink ring-1 ring-rail-line"
        >
          {me.initials}
        </span>
        <span className="min-w-0 leading-tight max-[90rem]:sr-only">
          <span className="block truncate text-sm font-medium">{me.name}</span>
          <span className="block truncate text-xs text-rail-ink-2">
            {me.role} · {firm.short}
          </span>
        </span>
      </div>
    </div>
  );
}
