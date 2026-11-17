# Product Brief

> **Working name:** Fin Ops (placeholder) · **Status:** Phase 0 (project setup) · **Last updated:** 17 Nov 2026

## Premise

We're a Chartered Accountant (domain) and a software engineer (product and engineering) building a
**management app for CAs**. It should handle the **day-to-day activities of a CA practice**,
including client compliance, accounts and other financial work, in one place.

It starts as an app for running a CA practice. Later it grows into a broader **platform** built around that
core. We haven't defined the platform scope yet.

## Market

**India only.** We don't plan to go international. So we design for Indian rules from day one
instead of building something generic and localising it later.

Implications we expect (to be confirmed with our CA co-founder as each module is scoped):

- **Compliance regimes:** GST, Income Tax (ITR), TDS/TCS, ROC/MCA, and others as needed.
- **Calendar:** Indian financial year (1 April to 31 March), assessment year, statutory due dates.
- **Money:** INR with Indian digit grouping (₹12,34,567.00), lakh/crore notation.
- **Formats:** DD/MM/YYYY dates, IST.
- **Identifiers:** PAN, GSTIN, TAN, CIN/LLPIN, DIN, Aadhaar (sensitive; handle with care).
- **Communication:** WhatsApp is the main channel between CAs and their clients.
- **Data:** client financial data is sensitive. Hosting region and DPDP Act obligations are still to be decided.

## Principles

1. **Speed above everything.** Every screen should feel instant. Server-render by default, ship as little
   client JavaScript as possible, serve static shells and stream in the data. Measure Core Web Vitals and
   treat regressions as bugs.
2. **Crafted, not vibe-coded.** No generic template look. The design should be deliberate and
   consistent: a dense, keyboard-friendly interface for professionals who work in it all day.
3. **Domain-correct.** Built together with a practising CA. Compliance logic is reviewed by the domain
   expert before it ships.

## Reference: Finexo ([finexo.in](https://finexo.in/))

Finexo is an existing Indian product for CA firms that we're using as a benchmark. Summary of its public site as of Nov 2026:

| Product                       | What it covers                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PMS** (practice management) | Client management. GST/ITR/TDS tasks auto-created from each client's QRMP choice, registration type and registration date. Automated WhatsApp reminders. Document management. Practice billing and invoicing. Time tracking. Team workload. Due-date dashboard. Filing records (ARN, acknowledgement no., date). It **does not file returns**; filing happens on government portals. |
| **Books** (accounting)        | GST-compliant invoicing, e-invoicing, inventory, expenses, bank reconciliation, GST-ready reports. Cloud-only.                                                                                                                                                                                                                                                                       |
| **Websites**                  | Website builder for CA/CS practices.                                                                                                                                                                                                                                                                                                                                                 |
| **Free tools**                | GSTIN search, return-filing status, GSTR Excel-to-JSON converters, 2A/2B/IMS reconciliation, calculators (GST, TDS, HRA, advance tax, depreciation, salary).                                                                                                                                                                                                                         |

- **Pricing:** PMS from ₹5,999/yr flat per firm (10 users), Books from ₹4,999/yr, both plus GST. Free trial.
- **Positioning:** built for Indian compliance, flat per-firm pricing (not per user), "lightning fast".
- **Not visible on their public site:** ROC/MCA workflows, client portal.

## Open decisions

- Which day-to-day workflows ship first (e.g. compliance calendar and tasks, client master, documents, billing)?
- Do we start with practice management (the CA firm's own operations) or accounting (the CA's clients' books)?
- Do we file returns through government APIs or GSPs, or only track filings?
- Pricing model: per firm or per user?
- Product name.
- Hosting provider and data residency.
- Stack beyond the frontend: database, auth, UI component layer, testing.

## Tech baseline (decided)

- Next.js 16 (App Router), React 19, TypeScript (strict)
- React Compiler, Cache Components with Partial Prefetching (static shells, streamed dynamic data)
- Tailwind CSS v4
- ESLint (Next.js Core Web Vitals rules) and Prettier
- npm

## Roadmap

- **Phase 0: Project setup** (done)
- **Phase 1:** Define the first module with the domain expert (TBD)
- **Later:** Grow into the platform
