"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Interactive checklist. State is local to the page view in Phase 1. */
export function Checklist({
  items,
  idPrefix,
}: {
  items: { label: string; done: boolean }[];
  idPrefix: string;
}) {
  const [state, setState] = useState(() => items.map((i) => i.done));
  const doneCount = state.filter(Boolean).length;
  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-3 figures">
        {doneCount} of {items.length} done
      </p>
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const id = `${idPrefix}-${i}`;
          return (
            <li key={id} className="flex min-h-7 items-center gap-2">
              <input
                id={id}
                type="checkbox"
                checked={state[i] ?? false}
                onChange={() =>
                  setState((s) => s.map((v, j) => (j === i ? !v : v)))
                }
                className="size-3.5 shrink-0 accent-navy"
              />
              <label
                htmlFor={id}
                className={cn(
                  "text-sm",
                  state[i]
                    ? "text-ink-3 line-through decoration-ink-4"
                    : "text-ink",
                )}
              >
                {item.label}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
