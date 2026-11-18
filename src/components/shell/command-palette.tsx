"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bookmark,
  Building2,
  CalendarClock,
  CornerDownLeft,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, SAVED_VIEWS } from "./nav";

export interface SearchIndex {
  clients: {
    code: string;
    name: string;
    pan: string;
    gstin: string;
    constitution: string;
  }[];
  batches: { key: string; label: string; due: string; open: number }[];
}

interface Result {
  id: string;
  group: string;
  /** First result of its group: renders the group heading. */
  first?: boolean;
  label: string;
  hint?: string;
  href: string;
  icon: ReactNode;
}

const ACTIONS: { label: string; href: string }[] = [
  { label: "New client", href: "/clients/new" },
  { label: "Record a filing", href: "/compliance?status=due" },
  { label: "Classify documents", href: "/documents?status=classify" },
  { label: "Raise an invoice", href: "/billing?tab=unbilled" },
];

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

const noopSubscribe = () => () => {};

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/**
 * Global command palette (Ctrl/⌘ K) and the "g" navigation chords. Searches clients by code,
 * name, PAN or GSTIN, the Due Board, modules, saved views and actions, entirely on the client
 * from a small index the layout provides.
 */
export function CommandPalette({ index }: { index: SearchIndex }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const mod = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    setQ("");
    setActive(0);
    d.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    let chord = false;
    let chordTimer: ReturnType<typeof setTimeout> | undefined;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
        return;
      }
      if (
        typing(e.target) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        dialog.current?.open
      )
        return;
      if (chord) {
        chord = false;
        clearTimeout(chordTimer);
        const item = NAV_ITEMS.find((n) => n.chord === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
        return;
      }
      if (e.key === "g") {
        chord = true;
        chordTimer = setTimeout(() => (chord = false), 900);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(chordTimer);
    };
  }, [open, close, router]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const has = (...fields: string[]) =>
      !term || fields.some((f) => f.toLowerCase().includes(term));
    const out: Result[] = [];

    const clients = index.clients
      .filter((c) => has(c.code, c.name, c.pan, c.gstin))
      .slice(0, term ? 8 : 4);
    for (const c of clients)
      out.push({
        id: `c-${c.code}`,
        group: "Clients",
        label: c.name,
        hint: `${c.code} · ${c.pan}`,
        href: `/clients/${c.code}`,
        icon: <Building2 />,
      });

    for (const b of index.batches
      .filter((b) => has(b.label))
      .slice(0, term ? 6 : 3))
      out.push({
        id: `b-${b.key}`,
        group: "Due Board",
        label: b.label,
        hint: `Due ${ddmm(b.due)} · ${b.open} open`,
        href: `/?sel=${b.key}`,
        icon: <CalendarClock />,
      });

    for (const n of NAV_ITEMS.filter((n) => has(n.label)))
      out.push({
        id: `n-${n.href}`,
        group: "Go to",
        label: n.label,
        hint: `g ${n.chord}`,
        href: n.href,
        icon: <ArrowRight />,
      });

    for (const v of SAVED_VIEWS.filter((v) => has(v.label)))
      out.push({
        id: `v-${v.href}`,
        group: "Saved views",
        label: v.label,
        href: v.href,
        icon: <Bookmark />,
      });

    for (const a of ACTIONS.filter((a) => has(a.label)))
      out.push({
        id: `a-${a.href}`,
        group: "Actions",
        label: a.label,
        href: a.href,
        icon: <Plus />,
      });

    return out.map((r, i) => ({
      ...r,
      first: i === 0 || out[i - 1]?.group !== r.group,
    }));
  }, [q, index]);

  const safeActive = Math.min(active, Math.max(results.length - 1, 0));

  function go(r: Result | undefined) {
    if (!r) return;
    close();
    router.push(r.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next =
        (safeActive + (e.key === "ArrowDown" ? 1 : -1) + results.length) %
        Math.max(results.length, 1);
      setActive(next);
      list.current
        ?.querySelector(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[safeActive]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex h-7 w-full max-w-[34rem] min-w-0 items-center gap-2 rounded-[3px] bg-rail-raised px-2.5 text-left text-sm text-rail-ink-2 ring-1 ring-rail-line transition-colors duration-150 hover:text-rail-ink hover:ring-rail-ink-2/40"
      >
        <Search aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">
          <span className="sm:hidden">Search</span>
          <span className="max-sm:hidden">
            Search clients, PAN, GSTIN, filings…
          </span>
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-0.5 sm:flex">
          <kbd className="rounded-[3px] border border-rail-line px-1 font-sans text-2xs leading-4">
            {mod}
          </kbd>
          <kbd className="rounded-[3px] border border-rail-line px-1 font-sans text-2xs leading-4">
            K
          </kbd>
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label="Command palette"
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-[4px] bg-surface p-0 text-ink shadow-[0_24px_60px_-20px_oklch(0.2_0.05_262/0.45)] ring-1 ring-line-strong backdrop:bg-[oklch(0.22_0.04_262/0.35)]"
      >
        <div className="flex h-11 items-center gap-2 border-b border-line px-3">
          <Search aria-hidden className="size-4 text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[safeActive]?.id}
            placeholder="Type a client, PAN, GSTIN, form or command"
            className="h-full flex-1 bg-transparent text-base outline-none"
          />
          <kbd className="rounded-[3px] border border-line-strong px-1 text-2xs text-ink-3">
            Esc
          </kbd>
        </div>
        <ul
          ref={list}
          id="palette-results"
          role="listbox"
          className="max-h-[min(26rem,60vh)] scroll-thin overflow-y-auto py-1"
        >
          {results.length === 0 && (
            <li className="px-4 py-6 text-sm text-ink-2">
              Nothing matches “{q}”. Try a client code like MEH-014, a PAN, or a
              form like GSTR-3B.
            </li>
          )}
          {results.map((r, i) => {
            return (
              <li key={r.id} role="presentation">
                {r.first && (
                  <p className="px-3 pt-2.5 pb-1 caps text-ink-3">{r.group}</p>
                )}
                <div
                  id={r.id}
                  role="option"
                  aria-selected={i === safeActive}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn(
                    "mx-1 flex h-8 cursor-pointer items-center gap-2.5 rounded-[3px] px-2 text-sm [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-ink-3",
                    i === safeActive && "bg-select",
                  )}
                >
                  {r.icon}
                  <span className="truncate">{r.label}</span>
                  {r.hint && (
                    <span className="ml-auto shrink-0 text-xs ident text-ink-3">
                      {r.hint}
                    </span>
                  )}
                  {i === safeActive && (
                    <CornerDownLeft
                      aria-hidden
                      className={cn(!r.hint && "ml-auto")}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex h-8 items-center gap-4 border-t border-line bg-sunken px-3 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-grid size-4 place-items-center rounded-[3px] border border-line-strong">
              <ArrowUp aria-label="Up" className="size-2.5" />
            </kbd>
            <kbd className="inline-grid size-4 place-items-center rounded-[3px] border border-line-strong">
              <ArrowDown aria-label="Down" className="size-2.5" />
            </kbd>
            to move · Enter to open
          </span>
          <span className="max-sm:hidden">g then c, f, w, d… to jump</span>
          <span className="ml-auto max-sm:hidden">
            j / k moves through lists
          </span>
        </div>
      </dialog>
    </>
  );
}
