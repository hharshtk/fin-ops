import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] font-medium whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:size-3.5 [&_svg]:shrink-0";

const VARIANT: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-hover active:bg-rail",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-ink-4 hover:bg-hover active:bg-select",
  ghost: "text-ink-2 hover:bg-hover hover:text-ink active:bg-select",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 px-2.5 text-sm",
  md: "h-8 px-3 text-sm",
};

export function buttonClass(
  variant: Variant = "secondary",
  size: Size = "sm",
  className?: string,
) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  type = "button",
  ...rest
}: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...rest
}: { variant?: Variant; size?: Size; children: ReactNode } & ComponentProps<
  typeof Link
>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
