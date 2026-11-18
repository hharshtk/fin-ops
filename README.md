# Fin Ops

Practice management for Chartered Accountants in India. The premise, principles and open decisions are in
[docs/PRODUCT.md](docs/PRODUCT.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · React Compiler · Cache Components

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Phase 1: the workstation UI

Phase 1 is frontend only, running on fictional sample data (the command bar shows a "Sample data" marker).
The visual system is documented in [DESIGN.md](DESIGN.md).

| Path                     | What lives there                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `src/app/(workstation)/` | Routes: Cockpit, Work, Compliance, Clients (+ workspace, new), Documents, Books, Billing, Team |
| `src/components/shell/`  | Rail, command bar, command palette (Ctrl/⌘ K), mobile menu                                     |
| `src/components/ui/`     | Shared primitives: tables, inspector, signal, tabs, segmented, fields                          |
| `src/features/<module>/` | Module components that take typed props and never fetch data themselves                        |
| `src/domain/types.ts`    | Domain shapes shared by the UI and the future versioned API                                    |
| `src/data/queries.ts`    | Cached read layer; Phase 1 resolves from `src/data/mock/`                                      |
| `src/lib/`               | India-first formatting (en-IN INR, lakh/crore, DD/MM/YYYY), signal ramp, URL helpers           |

Views are addressable: tabs, filters and the selected row live in the URL. Keyboard: Ctrl/⌘ K opens the
palette, `g` then a letter jumps between modules, `j` / `k` move through lists, `/` focuses list search, Esc
closes the inspector.

Selecting a row inside a screen goes to `/<screen>/inspect/<id>` (Cockpit: `/inspect/<id>`). Each screen's
layout has a `@panel` slot and intercepts that route, so a click fetches and renders only the inspector, not
the list; loading the URL directly renders the whole page. Row links prefetch on hover, focus or touch, and
the selected row warms its neighbours. Links from another screen use `?sel=<id>` instead, because the
Cockpit's root-level intercept would otherwise match navigations from every page.

## Scripts

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)   |
| `npm run build`        | Production build                   |
| `npm run start`        | Serve the production build         |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | Generate route types and run `tsc` |
| `npm run format`       | Format with Prettier               |
| `npm run format:check` | Check formatting (for CI)          |
