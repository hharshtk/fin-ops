"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Identifier with a copy button: PAN, GSTIN, ARN are pasted into portals all day. */
export function CopyText({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          setCopied(false);
        }
      }}
      title={`Copy ${label}`}
      aria-label={`Copy ${label} ${value}`}
      className="group -mx-1 inline-flex items-center gap-1.5 rounded-[3px] px-1 hover:bg-hover"
    >
      <span className="text-sm ident text-ink">{value}</span>
      {copied ? (
        <Check aria-hidden className="size-3 text-sig-green-ink" />
      ) : (
        <Copy
          aria-hidden
          className="size-3 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
