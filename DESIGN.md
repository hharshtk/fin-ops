---
name: Fin Ops
description: The CA practice workstation, set like a railway timetable.
colors:
  rail-navy: "oklch(0.275 0.058 262)"
  rail-raised: "oklch(0.335 0.064 262)"
  rail-line: "oklch(0.37 0.05 262)"
  rail-ink: "oklch(0.96 0.008 262)"
  rail-ink-muted: "oklch(0.8 0.028 262)"
  timetable-ground: "oklch(0.968 0.005 95)"
  sheet-white: "oklch(1 0 0)"
  sunken: "oklch(0.958 0.005 95)"
  hairline: "oklch(0.9 0.006 95)"
  rule-strong: "oklch(0.79 0.01 95)"
  ink: "oklch(0.22 0.02 262)"
  ink-2: "oklch(0.4 0.018 262)"
  ink-3: "oklch(0.5 0.014 262)"
  ink-4: "oklch(0.66 0.01 262)"
  action-navy: "oklch(0.33 0.078 262)"
  action-navy-hover: "oklch(0.29 0.075 262)"
  hover-wash: "oklch(0.968 0.008 262)"
  selection-wash: "oklch(0.938 0.026 262)"
  focus-blue: "oklch(0.55 0.16 258)"
  signal-red: "oklch(0.565 0.195 29)"
  signal-red-ink: "oklch(0.5 0.18 29)"
  signal-yellow: "oklch(0.81 0.16 82)"
  signal-yellow-ink: "oklch(0.5 0.105 68)"
  signal-green: "oklch(0.6 0.13 152)"
  signal-green-ink: "oklch(0.46 0.1 152)"
  lamp-off: "oklch(0.4 0.04 262)"
typography:
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.54
    fontFeature: '"lnum"'
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    fontFeature: '"tnum", "lnum"'
    fontVariation: '"wdth" 78'
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.03em"
    fontVariation: '"wdth" 86'
  identifier:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "0.01em"
    fontFeature: '"tnum", "lnum", "zero"'
rounded:
  none: "0px"
  lamp: "2px"
  control: "3px"
  overlay: "4px"
spacing:
  hair: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  row: "28px"
  strip: "36px"
  bar: "40px"
  header: "44px"
components:
  button-primary:
    backgroundColor: "{colors.action-navy}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  button-primary-hover:
    backgroundColor: "{colors.action-navy-hover}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  button-secondary-hover:
    backgroundColor: "{colors.hover-wash}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  input-field:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  table-header-cell:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    height: "28px"
  table-row-selected:
    backgroundColor: "{colors.selection-wash}"
  rail:
    backgroundColor: "{colors.rail-navy}"
    textColor: "{colors.rail-ink-muted}"
    width: "208px"
  rail-item-active:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.rail-ink}"
    rounded: "{rounded.control}"
    height: "32px"
---

# Design System: Fin Ops

## Overview

**Creative North Star: "The Railway Timetable"**

Every statutory due date runs on a timetable, so the workstation reads like one. The system borrows from the Indian Railways printed timetable, _Trains at a Glance_ and the station boards: a solid navy shell, an off-white page, dense condensed figures in strict columns, dates printed once per group like departure times, and status read off a signal. The world lends type, palette, density and one signature move. Layout, navigation and controls stay those of a standard professional web app (rail, command bar, tabs, tables, inspector), so an accountant knows where everything is before they notice the world.

Density is the point. Rows are 28px, body text is 13px, and the working sheet is one white surface divided by hairlines rather than a floor of cards. Hierarchy comes from figure size and weight on that sheet, never from shadows or tinted boxes. Saturated colour exists only to carry state: the four signal aspects. Charts never lead; where a bar appears it carries counts that are also printed beside it.

The physical scene decided the light theme: partners and article assistants at office desktops, under daylight and tube lights, eight to ten hours a day, with portal PDFs and WhatsApp open alongside.

**Key Characteristics:**

- Navy rail and command bar; off-white ground; white working sheet divided by 1px hairlines.
- Archivo at two widths: normal for interface text, condensed for figures, dates and column heads.
- The four-aspect signal head on every list, always paired with a "late by" or "due in" figure.
- Timetable rhythm in tables: date printed once per group, a stronger rule every fifth row, a double rule between groups.
- URL-addressable views: every tab, filter and selection is a link, so any view can be saved or shared.

## Colors

A restrained navy-and-paper palette where the only saturated colours are railway signal aspects, used for state and nothing else.

### Primary

- **Rail Navy** (`rail-navy`): the shell. Fills the left rail and the command bar as one solid field, so the frame of the app is unmistakable at a glance and the working sheet reads as the page inside it.
- **Action Navy** (`action-navy`): primary buttons, the active tab underline, "Ready to file" status text. Slightly brighter than the rail so actions inside the sheet still read as navy-family.

### Secondary

- **Signal Red** (`signal-red`, text `signal-red-ink`): overdue. The lower lamp of the signal head, "6d late" figures, overdue dates on the Due Board, over-capacity load.
- **Signal Yellow** (`signal-yellow`, text `signal-yellow-ink`): due within 3 days (single lamp) or within 7 days (both lamps); also "Awaiting data", the state that is blocked on the client.
- **Signal Green** (`signal-green`, text `signal-green-ink`): clear, filed, reconciled, paid.

### Neutral

- **Timetable Ground** (`timetable-ground`): the page behind the sheet, visible below short content and as the out-of-month days in the calendar.
- **Sheet White** (`sheet-white`): every working surface: tables, panels, inspector, forms.
- **Sunken** (`sunken`): column-head rows, toolbars inside segmented controls, skeleton bars.
- **Hairline** (`hairline`) and **Rule Strong** (`rule-strong`): 1px dividers between regions and rows; the stronger rule marks every fifth row and group boundaries.
- **Ink 1 to 4** (`ink` to `ink-4`), navy-tinted: primary text, secondary text, tertiary labels (still at least 4.5:1 on white), and placeholders such as the "·" in empty count cells.
- **Washes** (`hover-wash`, `selection-wash`): row hover and selected row.

### Named Rules

**The Signal-Only Rule.** Red, yellow and green appear only as state. Never as decoration, category colour, brand accent or chart series.

**The Never-Alone Rule.** A signal is always accompanied by text that says the same thing: a "late by" figure, a status word, or an accessible label. Colour is never the only cue.

**The One-Field Shell Rule.** The rail and the command bar are one flat navy field. No gradients, no glass, no second shell colour.

## Typography

**Display Font:** none. The system has no display face.
**Body Font:** Archivo (with ui-sans-serif, system-ui), self-hosted by next/font, `latin` and `latin-ext` subsets (latin-ext carries ₹).
**Label/Mono Font:** Archivo at reduced width. There is no monospace.

**Character:** a sturdy print grotesque that can narrow itself. At normal width it is a calm interface face; condensed (78 to 86% width) it becomes the timetable's figure column.

### Hierarchy

- **Headline** (600, 1.25rem): screen and client names in the workspace header. Used sparingly.
- **Title** (600, 0.875rem): page titles in the header strip, panel titles, inspector titles at 1rem.
- **Body** (400, 0.8125rem, line height 1.25rem): table cells, inspector facts, form values. Tables run at this size.
- **Figure** (700, 1.25rem, condensed, tabular): the signal summary line and the dates on the Due Board (1rem). Figures are condensed and tabular wherever numbers stack.
- **Label** (600, 0.6875rem, uppercase, 0.03em, condensed): column heads, inspector section headings, rail group names.
- **Identifier** (400, 0.8125rem, tabular with slashed zero): PAN, GSTIN, TAN, CIN, ARN, voucher and invoice numbers, so O and 0 never collide.

### Named Rules

**The Two-Width Rule.** One family. Interface text at normal width; figures, dates and column heads condensed. No second typeface.

**The Tabular Rule.** Any number that can stack in a column is tabular and lining: amounts, counts, dates, hours.

**The Indian Figures Rule.** Money uses en-IN grouping (₹12,34,567); summaries use lakh and crore (₹3.84 L, ₹1.26 Cr); dates are DD/MM/YYYY and times IST.

## Layout

A workspace-first shell: a 208px navy rail (collapsing to a 56px icon rail below 1440px, and to a popover drawer below 768px), a 40px command bar, and one scrolling workspace. List screens put a fixed inspector column on the right (336px, 384px from 1536px); under 1024px the inspector becomes a bottom sheet shown only for an explicit selection.

Inside the workspace, the order is fixed: a 44px header strip (title, meta, view controls), optional tabs (36px), a toolbar of filters and list search (44px), then the content. On the Cockpit the header and the signal summary line span the full width above both the list and the inspector.

Rhythm: rows at 28px, panel header strips at 36px, gutters of 12px (16px from 640px). Regions sit edge to edge on the white sheet, divided by hairlines; there are no gaps between panels. Secondary columns drop out below 1536px and again below 768px rather than letting the last column clip.

### Named Rules

**The Timetable Rhythm Rule.** In grouped tables the group key (usually the due date) prints once, on the first row. Every fifth row carries the strong rule; groups are separated by a double rule.

**The Addressable View Rule.** Tabs, filters, view toggles and the selected row live in the URL. A saved view is a link.

## Elevation & Depth

Flat by default. Depth is conveyed by the navy shell framing a white sheet, by hairlines, and by tonal washes for hover and selection. Shadows exist only on elements that genuinely float above the page.

### Shadow Vocabulary

- **Overlay** (`box-shadow: 0 24px 60px -20px oklch(0.2 0.05 262 / 0.45)`): the command palette dialog.
- **Menu** (`box-shadow: 0 12px 32px -12px oklch(0.2 0.05 262 / 0.4)`): popover menus such as quick create.
- **Sheet** (`box-shadow: 0 -8px 24px -12px oklch(0.22 0.04 262 / 0.35)`): the inspector as a bottom sheet on small screens.

### Named Rules

**The Float-Only Shadow Rule.** If it does not float over other content, it has no shadow. Panels, tables and the inspector column are flat.

## Shapes

Square structure, barely rounded controls. Panels, tables and the sheet have 0 radius. Buttons, inputs, segmented controls and menu items use 3px; overlays 4px; the signal head 2px. Lines are 1px everywhere except the timetable group rule (2px) and the active tab underline (2px). Status markers are 6px squares with a 1px radius, echoing a printed bullet rather than a pill.

## Components

### Buttons

Compact and quiet; the label names the action.

- **Shape:** gently squared (3px), 28px tall (32px for form submits), 14px icons.
- **Primary:** Action Navy fill, white text. One per region at most, usually the inspector's first action.
- **Secondary:** white with a strong-rule border; hover adds the hover wash.
- **Ghost:** text only in Ink 2; used for navigation actions such as "Calendar", "All" or "Client" with an arrow icon.
- **States:** 150ms colour transitions; disabled at 45% opacity; 2px focus-blue outline.

### Segmented control

- **Style:** a sunken track with a 1px strong border; the active segment is white with a hairline ring. Each segment is a link (scope, view, status, channel, partner filters).

### Status

- **Style:** quiet text with a 6px square marker. Colour only when the state needs action (green filed, yellow awaiting client, red overdue invoice, navy ready to file); otherwise Ink 2 or Ink 3.

### Inputs / Fields

- **Style:** 32px, white, strong-rule border, 3px radius, label above in Ink 2 at 0.75rem, hint or error below.
- **Focus:** border turns focus blue.
- **Error:** red border via `aria-invalid` and a message that names the problem and the fix ("ARN should look like AA271126034871K").
- **Identifiers:** uppercase, tabular, slashed zero; PAN and GSTIN hints decode what was typed (PAN fourth character, GSTIN state code).

### Navigation

- **Rail:** navy field, group labels in condensed caps, 32px items with 16px icons (1.75 stroke). The active item gets the raised navy fill; counts sit right-aligned in condensed figures, red when they are overdue counts. Saved views list beneath the modules.
- **Command bar:** search trigger styled as a raised field with its shortcut, quick-create menu, FY and quarter, and a "Sample data" marker while Phase 1 runs on fictional data.
- **Command palette:** Ctrl/⌘ K. Searches clients by code, name, PAN or GSTIN, the Due Board, modules, saved views and actions. "g" then a letter jumps between modules; j and k move through any list; Esc closes the inspector.

### Tables

- **Header:** sunken row, label typography, sticky to the top of the workspace.
- **Rows:** 28px, hairline bottom border, whole row clickable through a stretched link; hover wash; selected rows take the selection wash, and keyboard focus shows the same wash before the server response arrives.
- **Numbers:** right-aligned, condensed, tabular; an empty count prints "·" in Ink 4.

### Inspector

- **Style:** the right-hand column of every list screen. A heading block (title, meta line beneath, signal at left), an action row, then sections headed in label typography with facts as a two-column definition list. Closes with Esc or the × in its corner.

### Signal head (signature component)

A 9 × 15px Rail Navy head with two 5px lamps. Red lights the lower lamp; yellow (due within 3 days) and green (clear) light the upper lamp; double yellow (due within 7 days) lights both. Position carries meaning as well as colour. The brand mark is the same head at 13 × 22px showing green.

### Due Board (signature component)

The Cockpit's lead object: filing batches (form, period, due date) set in timetable rhythm, with the signal first, the date printed once per group in condensed bold (red when overdue), filed over total, the work-in-progress breakdown, and a "late / due" figure. A key to the four aspects sits in its header.

## Do's and Don'ts

### Do:

- **Do** pair every signal with a figure or word ("17d late", "in 3d", "Awaiting data").
- **Do** set money with en-IN grouping, summaries in lakh and crore, dates as DD/MM/YYYY, times in IST, and FY as April to March.
- **Do** put identifiers (PAN, GSTIN, ARN) in the identifier style, with a copy affordance where they are pasted into portals.
- **Do** divide regions with 1px hairlines on one white sheet; use the strong rule for every fifth row and the double rule between groups.
- **Do** keep filters, tabs and selection in the URL so views are shareable and keyboard navigation works.
- **Do** drop secondary columns at narrower widths instead of letting the last column clip.

### Don't:

- **Don't** use red, yellow or green for anything but state.
- **Don't** float panels as cards or give flat surfaces shadows; only overlays, menus and the mobile sheet carry shadows.
- **Don't** lead a screen with a row of KPI tiles or a chart; lead with the list that needs action.
- **Don't** add a second typeface or a monospace; condense Archivo for figures instead.
- **Don't** put a small label or eyebrow above a heading, or a coloured stripe down the side of a row or panel.
- **Don't** use Unicode glyphs or emoji as icons; icons are drawn (Lucide, 1.75 to 2 stroke).
