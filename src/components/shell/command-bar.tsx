import { ChevronDown, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { getSearchIndex } from "@/data/queries";
import { fyLabel, fyQuarter } from "@/lib/format";
import { TODAY } from "@/lib/today";
import { CommandPalette } from "./command-palette";
import { NAV, SAVED_VIEWS } from "./nav";
import { NavIcon } from "./nav-icon";
import { BrandMark, railCounts } from "./rail";
import { RailLink } from "./rail-link";

const CREATE = [
  { label: "New client", href: "/clients/new" },
  { label: "Record a filing", href: "/compliance?status=due" },
  { label: "Upload documents", href: "/documents?status=classify" },
  { label: "Raise an invoice", href: "/billing?tab=unbilled" },
];

/** Top bar: search and command palette, quick create, financial year, sample-data marker. */
export async function CommandBar() {
  const index = await getSearchIndex();
  return (
    <div className="flex h-10 items-center gap-2 border-b border-rail-line bg-rail px-2 text-rail-ink sm:gap-3 sm:px-3">
      <button
        type="button"
        popoverTarget="mobile-nav"
        aria-label="Open menu"
        className="grid size-8 shrink-0 place-items-center rounded-[3px] text-rail-ink-2 hover:bg-rail-raised hover:text-rail-ink md:hidden"
      >
        <Menu className="size-4" />
      </button>
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 md:hidden"
        aria-label="Fin Ops, Cockpit"
      >
        <BrandMark />
      </Link>

      <CommandPalette index={index} />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          popoverTarget="quick-create"
          className="flex h-7 items-center gap-1 rounded-[3px] bg-rail-raised px-2 text-sm font-medium text-rail-ink ring-1 ring-rail-line hover:bg-rail-line"
        >
          <Plus aria-hidden className="size-3.5" />
          <span className="max-sm:sr-only">New</span>
          <ChevronDown
            aria-hidden
            className="size-3 text-rail-ink-2 max-sm:hidden"
          />
        </button>
        <div
          id="quick-create"
          popover="auto"
          className="fixed inset-auto top-11 right-2 w-52 rounded-[4px] bg-surface py-1 text-ink shadow-[0_12px_32px_-12px_oklch(0.2_0.05_262/0.4)] ring-1 ring-line-strong sm:right-36"
        >
          {CREATE.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex h-8 items-center px-3 text-sm hover:bg-hover"
            >
              {c.label}
            </Link>
          ))}
        </div>

        <span
          className="hidden text-sm text-rail-ink-2 figures lg:inline"
          title="Financial year and quarter"
        >
          {fyLabel(TODAY)} · Q{fyQuarter(TODAY)}
        </span>
        <span
          className="hidden h-5 items-center rounded-[2px] px-1.5 text-2xs font-semibold tracking-wide text-[oklch(0.86_0.12_85)] uppercase ring-1 ring-[oklch(0.86_0.12_85/0.45)] sm:inline-flex"
          title="Phase 1: every figure on screen is sample data"
        >
          Sample data
        </span>
      </div>
    </div>
  );
}

/** Small-screen menu: the rail as a popover drawer. Zero JavaScript, via the popover API. */
export async function MobileNav() {
  const counts = await railCounts();
  return (
    <div
      id="mobile-nav"
      popover="auto"
      className="fixed inset-y-0 right-auto left-0 h-dvh w-72 max-w-[85vw] overflow-y-auto bg-rail text-rail-ink backdrop:bg-[oklch(0.22_0.04_262/0.4)] md:hidden"
    >
      <div className="flex h-10 items-center gap-2.5 border-b border-rail-line px-3">
        <BrandMark />
        <span className="text-md font-bold">Fin Ops</span>
        <button
          type="button"
          popoverTarget="mobile-nav"
          popoverTargetAction="hide"
          aria-label="Close menu"
          className="ml-auto grid size-8 place-items-center rounded-[3px] text-rail-ink-2 hover:bg-rail-raised"
        >
          <X className="size-4" />
        </button>
      </div>
      <nav aria-label="Modules" className="flex flex-col gap-4 p-2">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="mb-1 px-2 caps text-rail-ink-2/80">{g.group}</p>
            {g.items.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<NavIcon name={item.icon} />}
                count={counts[item.href]?.count}
                countTone={counts[item.href]?.tone}
                compact={false}
              />
            ))}
          </div>
        ))}
        <div>
          <p className="mb-1 px-2 caps text-rail-ink-2/80">Saved views</p>
          {SAVED_VIEWS.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="flex h-8 items-center rounded-[3px] px-2 text-sm text-rail-ink-2 hover:bg-rail-raised"
            >
              {v.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
