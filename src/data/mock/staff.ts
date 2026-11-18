import type { StaffMember } from "@/domain/types";

/** Sample firm: Deshpande Iyer & Associates, Chartered Accountants, Pune. Fictional. */
export const FIRM = {
  name: "Deshpande Iyer & Associates",
  short: "DIA",
  city: "Pune",
  frn: "1294xxW",
};

export const CURRENT_USER_ID = "md";

export const STAFF: StaffMember[] = [
  {
    id: "md",
    name: "Meera Deshpande",
    initials: "MD",
    role: "Partner",
    capacityHours: 40,
    assignedHours: 31,
  },
  {
    id: "ai",
    name: "Arjun Iyer",
    initials: "AI",
    role: "Partner",
    capacityHours: 40,
    assignedHours: 26,
  },
  {
    id: "rs",
    name: "Ritu Shah",
    initials: "RS",
    role: "Manager",
    capacityHours: 45,
    assignedHours: 47,
  },
  {
    id: "kb",
    name: "Kunal Bhatia",
    initials: "KB",
    role: "Manager",
    capacityHours: 45,
    assignedHours: 39,
  },
  {
    id: "sp",
    name: "Sneha Patil",
    initials: "SP",
    role: "Senior",
    capacityHours: 45,
    assignedHours: 53,
  },
  {
    id: "is",
    name: "Imran Shaikh",
    initials: "IS",
    role: "Senior",
    capacityHours: 45,
    assignedHours: 41,
  },
  {
    id: "pn",
    name: "Pooja Nair",
    initials: "PN",
    role: "Accountant",
    capacityHours: 45,
    assignedHours: 38,
  },
  {
    id: "vj",
    name: "Vikram Joshi",
    initials: "VJ",
    role: "Article",
    capacityHours: 40,
    assignedHours: 44,
  },
  {
    id: "ar",
    name: "Ananya Rao",
    initials: "AR",
    role: "Article",
    capacityHours: 40,
    assignedHours: 29,
  },
  {
    id: "tk",
    name: "Tanmay Kale",
    initials: "TK",
    role: "Article",
    capacityHours: 40,
    assignedHours: 36,
  },
];

/** Who prepares work under each manager. */
export const TEAMS: Record<string, string[]> = {
  rs: ["sp", "vj", "pn"],
  kb: ["is", "ar", "tk"],
};
