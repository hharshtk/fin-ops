import {
  BookOpen,
  Building2,
  CalendarClock,
  Gauge,
  Inbox,
  ListChecks,
  ReceiptIndianRupee,
  UsersRound,
} from "lucide-react";
import type { NavItem } from "./nav";

const ICONS = {
  cockpit: Gauge,
  work: ListChecks,
  compliance: CalendarClock,
  clients: Building2,
  documents: Inbox,
  books: BookOpen,
  billing: ReceiptIndianRupee,
  team: UsersRound,
} as const;

export function NavIcon({
  name,
  className,
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const Icon = ICONS[name];
  return (
    <Icon aria-hidden strokeWidth={1.75} className={className ?? "size-4"} />
  );
}
