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
