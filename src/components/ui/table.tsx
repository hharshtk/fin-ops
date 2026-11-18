import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Align = "left" | "right" | "center";

const ALIGN: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Timetable table. `rhythm` adds the stronger rule every fifth row and the double rule between
 * tbody groups.
 */
export function Table({
  children,
  rhythm = true,
  className,
  label,
}: {
  children: ReactNode;
  rhythm?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <table
      aria-label={label}
      className={cn(
        "w-full border-separate border-spacing-0 text-sm",
        rhythm && "tt",
        className,
      )}
    >
      {children}
    </table>
  );
}

export function Th({
  children,
  align = "left",
  className,
  width,
  sticky = true,
}: {
  children?: ReactNode;
  align?: Align;
  className?: string;
  width?: string;
  sticky?: boolean;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        "h-7 border-b border-line bg-sunken px-2 caps whitespace-nowrap text-ink-3 first:pl-3 last:pr-3",
        sticky && "sticky top-0 z-[2]",
        ALIGN[align],
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
  ...rest
}: { children?: ReactNode; align?: Align; className?: string } & Omit<
  ComponentProps<"td">,
  "align"
>) {
  return (
    <td
      {...rest}
      className={cn(
        "h-7 border-b border-line px-2 whitespace-nowrap first:pl-3 last:pr-3",
        align === "right" && "figures",
        ALIGN[align],
        className,
      )}
    >
      {children}
    </td>
  );
}

/** A selectable row. Put a RowLink in its primary cell; the link stretches over the whole row and
 * carries the selected state, which the row's background follows. */
export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr data-row className={cn("row", className)}>
      {children}
    </tr>
  );
}

export { RowLink } from "./row-link";

/** Group heading inside a timetable: a date, a status, a regime. */
export function GroupRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr>
      <th
        scope="rowgroup"
        colSpan={colSpan}
        className={cn(
          "h-7 border-b border-line bg-surface px-3 text-left font-normal",
          className,
        )}
      >
        {children}
      </th>
    </tr>
  );
}

export function TotalRow({ children }: { children: ReactNode }) {
  return (
    <tr className="[&>td]:border-t-2 [&>td]:border-b-0 [&>td]:border-line-strong [&>td]:font-semibold">
      {children}
    </tr>
  );
}
