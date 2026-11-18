"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { listPath } from "@/lib/url";

/**
 * Filters the current list through the `q` search param as you type (debounced). The list itself
 * stays server-rendered; this leaf only writes the URL.
 */
export function SearchField({
  placeholder,
  className,
  param = "q",
}: {
  placeholder: string;
  className?: string;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get(param) ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function update(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (next.trim()) sp.set(param, next.trim());
      else sp.delete(param);
      sp.delete("sel");
      // Filtering always targets the list itself, never a selected row's panel route.
      const base = listPath(pathname);
      const qs = sp.toString();
      startTransition(() =>
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false }),
      );
    }, 180);
  }

  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3",
          pending && "animate-pulse",
        )}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            update("");
          }
        }}
        placeholder={placeholder}
        data-list-search
        className="h-7 w-full rounded-[3px] border border-line-strong bg-surface pr-2 pl-7 text-sm hover:border-ink-4 focus:border-focus focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
}

/** Static stand-in rendered while search params resolve during prerendering. */
export function SearchFieldFallback({
  placeholder,
  className,
}: {
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3"
      />
      <input
        disabled
        placeholder={placeholder}
        className="h-7 w-full rounded-[3px] border border-line-strong bg-surface pr-2 pl-7 text-sm"
      />
    </div>
  );
}
