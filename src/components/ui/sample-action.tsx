"use client";

import { Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import { buttonClass } from "./button";

/**
 * An action button for Phase 1. It acknowledges the click without doing anything, so the flow can
 * be walked through on sample data.
 */
export function SampleAction({
  children,
  done = "Done (sample)",
  variant = "secondary",
  className,
}: {
  children: ReactNode;
  done?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setClicked(true)}
      aria-live="polite"
      className={buttonClass(clicked ? "secondary" : variant, "sm", className)}
    >
      {clicked ? (
        <>
          <Check className="text-sig-green-ink" />
          {done}
        </>
      ) : (
        children
      )}
    </button>
  );
}
