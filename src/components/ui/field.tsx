import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "h-8 w-full rounded-[3px] border border-line-strong bg-surface px-2.5 text-sm text-ink transition-colors duration-150 hover:border-ink-4 focus:border-focus focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus/40 disabled:bg-sunken disabled:text-ink-3 aria-invalid:border-sig-red";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
  required,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
        {label}
        {required && <span className="text-sig-red-ink"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-sig-red-ink">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(CONTROL, "h-auto min-h-16 py-1.5 leading-5", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(CONTROL, "appearance-none pr-7")} {...rest}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}

export function Checkbox({
  className,
  ...rest
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("size-3.5 shrink-0 rounded-[2px] accent-navy", className)}
      {...rest}
    />
  );
}
