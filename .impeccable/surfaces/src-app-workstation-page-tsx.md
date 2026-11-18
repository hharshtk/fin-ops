---
version: 1
slug: "src-app-workstation-page-tsx"
primary_target: "src/app/(workstation)/page.tsx"
related_targets: ["src/app/(workstation)/layout.tsx"]
---

# Surface brief: Workstation (cockpit and module screens)

## Scope and mode

Mode: Operate. The authenticated workstation: application shell, the Cockpit at `/`, and the representative
module screens (Compliance, Clients, client workspace, Work, Books, Documents, Billing, Team). Phase 1 is UI
only, on sample data.

## Audience, job, constraints

- Partners, managers and article assistants in an Indian CA practice, at office desktops (1366 to 1920 wide),
  daylight plus tube lighting, eight to ten hours a day, portal PDFs and WhatsApp open alongside.
- Job: open the app and know at once what is overdue, what is due next, what is blocked on whom, and act
  without hopping between disconnected pages.
- Constraints: Koyfin sets the craft bar (workspace-first, dense, keyboard-led, inspector-based), not the
  look. Charts never lead. India-first formats (en-IN INR, DD/MM/YYYY, IST, FY Apr to Mar). Server
  Components by default; client JS only at interactive leaves. No backend, auth or business logic.

## Direction contract

THESIS: Every statutory due date runs on a timetable, so the workstation reads like one. It refuses the
category default of a KPI-tile row over donut charts; the lead object is a schedule of filings with status
read off a signal.

OWN-WORLD: Indian Railways printed timetable. Solid navy shell (rail and command bar), off-white working
ground, white panels separated by hairlines, near-black navy-tinted ink. Archivo at two widths: normal for UI,
condensed for figures and column heads. Signal red, yellow and green as the only saturated colours, used for
state. No cards, gradients or shadows carrying hierarchy.

STORY: A partner lands on the Cockpit, reads the signal summary line, scans the Due Board by date, opens a
filing in the inspector, sees who it is blocked on, and jumps to the client or the task in one move.

FIRST VIEWPORT: Navy rail at left (modules), navy command bar on top (search, FY, sample-data tag). Below,
a one-line signal summary of figures. Centre-left, the Due Board: filings grouped by due date in timetable
column rhythm (Due, Form, Period, Ready, Pending with, Late by, Signal), heavier rule between date groups.
Beside it, the Exceptions queue. Right, the inspector for the selected row. Primary action sits in the
inspector.

FORM: Railway timetable, position 3 of 7 on the ordered list. seed:540caf163db56166. Signature move: the
four-aspect signal glyph (red overdue, yellow due within 3 days, double yellow within 7, green clear) used
identically on every screen, paired with a late-by or due-in figure. Raised lines: hierarchy by type on a
baseline grid (specimen); whole client book scannable by code (catalog); flat solid colour (guide map); one
fixed urgency ramp (star atlas); tabular figures and true hairlines (bitmap specimen); team load against hard
capacity (j-card).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Dark theme deferred; tokens are structured so it can be added.
- Product name is a placeholder (Fin Ops).
