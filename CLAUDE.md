@AGENTS.md

# Project

A management app for Chartered Accountants (CA practices) in the **Indian market only**. Read
[docs/PRODUCT.md](docs/PRODUCT.md) for the premise, principles, competitor reference and open decisions
before proposing features.

## Non-negotiables

- **Speed first.** Use Server Components by default. Put `"use client"` only on the leaf components that
  need interactivity. Justify any new client-side dependency by its bundle cost.
- **Must not look vibe-coded.** No default or template visuals. Follow the design system once it exists.
- **India-first formatting.** INR with `en-IN` grouping, Indian FY (Apr to Mar), DD/MM/YYYY, IST.

## Commands

- `npm run dev`: dev server (Turbopack)
- `npm run build`: production build
- `npm run lint` / `npm run typecheck` / `npm run format`
