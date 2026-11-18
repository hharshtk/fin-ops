import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Workspace title strip: name of the screen, a meta line, and screen-level actions. */
export function PageHeader({
  title,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-3 py-1.5 sm:px-4",
        className,
      )}
    >
      <h1 className="text-base font-semibold">{title}</h1>
      {meta && <div className="text-sm text-ink-3 figures">{meta}</div>}
      {actions && (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/** Filter strip beneath a header. */
export function Toolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-1.5 sm:px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
