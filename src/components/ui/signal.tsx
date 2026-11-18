import type { Aspect, ISODate } from "@/domain/types";
import { cn } from "@/lib/cn";
import { ASPECT_LABEL, dueText } from "@/lib/signal";

/** The four-aspect signal head. Always paired with text nearby, so colour is never the only cue. */
export function Signal({
  aspect,
  label,
  className,
}: {
  aspect: Aspect;
  label?: string;
  className?: string;
}) {
  const text = label ?? ASPECT_LABEL[aspect];
  return (
    <span
      role="img"
      aria-label={text}
      title={text}
      data-aspect={aspect}
      className={cn("signal", className)}
    >
      <i />
      <i />
    </span>
  );
}

const TONE = {
  red: "text-sig-red-ink font-medium",
  yellow: "text-sig-yellow-ink font-medium",
  neutral: "text-ink-2",
} as const;

/** "6d late", "Today", "in 5d" set as a timetable figure. */
export function DueIn({
  due,
  done,
  className,
}: {
  due: ISODate;
  done?: boolean;
  className?: string;
}) {
  if (done)
    return <span className={cn("text-ink-3 figures", className)}>Done</span>;
  const { text, tone } = dueText(due);
  return <span className={cn("figures", TONE[tone], className)}>{text}</span>;
}
