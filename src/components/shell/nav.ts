/** Module map shared by the rail, the mobile menu and the command palette. */
export interface NavItem {
  href: string;
  label: string;
  /** Second key of the "g" chord, e.g. g then c opens Clients. */
  chord: string;
  icon:
    | "cockpit"
    | "work"
    | "compliance"
    | "clients"
    | "documents"
    | "books"
    | "billing"
    | "team";
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Today",
    items: [
      { href: "/", label: "Cockpit", chord: "h", icon: "cockpit" },
      { href: "/work", label: "Work", chord: "w", icon: "work" },
    ],
  },
  {
    group: "Practice",
    items: [
      {
        href: "/compliance",
        label: "Compliance",
        chord: "f",
        icon: "compliance",
      },
      { href: "/clients", label: "Clients", chord: "c", icon: "clients" },
      { href: "/documents", label: "Documents", chord: "d", icon: "documents" },
    ],
  },
  {
    group: "Accounting",
    items: [{ href: "/books", label: "Books", chord: "b", icon: "books" }],
  },
  {
    group: "Firm",
    items: [
      { href: "/billing", label: "Billing", chord: "i", icon: "billing" },
      { href: "/team", label: "Team", chord: "t", icon: "team" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

/** Saved views: filters a user pinned. Phase 1 ships a fixed set; later these are per user. */
export const SAVED_VIEWS: { label: string; href: string }[] = [
  { label: "Overdue, firm-wide", href: "/compliance?status=overdue" },
  {
    label: "GSTR-3B Oct 2026",
    href: "/compliance?form=GSTR-3B&period=Oct+2026",
  },
  { label: "Awaiting client data", href: "/compliance?status=awaiting" },
  { label: "My reviews", href: "/work?who=me&status=review" },
  { label: "Audit clients", href: "/clients?svc=Audit" },
];
