import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A region of the working sheet: a 36px header strip and its content. Panels sit on one white
 * surface and are divided by hairlines, never floated as cards.
 */
export function Panel({
  title,
  meta,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("flex min-w-0 flex-col bg-surface", className)}
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        <h2
          id={id ? `${id}-title` : undefined}
          className="text-sm font-semibold whitespace-nowrap"
        >
          {title}
        </h2>
        {meta && (
          <div className="min-w-0 truncate text-sm text-ink-3 figures">
            {meta}
          </div>
        )}
        {actions && (
          <div className="ml-auto flex items-center gap-1">{actions}</div>
        )}
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
