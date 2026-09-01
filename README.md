# Finza — AI Finance Tracker

A personal finance tracker with a calm, premium dark "aurora" theme — built for everyday budgeting in Moroccan Dirham (MAD). Log spending, let AI sort your transactions automatically, keep an eye on monthly budgets, and get gentle insight cards about your habits.

## Site concept

Finza is a single, focused tool for one thing: **making your money feel understandable.** No charts for chart's sake, no jargon. You get a dashboard that answers "where did my money go?", a transaction list that stays out of your way, budgets that check themselves, and AI nudges delivered like a quiet friend — never an alarm.

### Screens

- **Landing** — a short, atmospheric pitch over a slow-moving aurora background.
- **Dashboard** — balance, this month's spend and income, savings rate, a weekly spend pulse, top categories, and recent activity.
- **Transactions** — full list with search, type filter, sorting, inline **AI categorization**, and add/edit/delete.
- **Budgets** — set monthly limits per category; view progress at a glance.
- **Insights** — AI-generated, matter-of-fact notes on your spending rhythms (positive / neutral / warning).
- **Settings** — currency, region, and your data (export / reset).

### How it feels

- Deep-space dark palette with cyan + violet **aurora** accents.
- Glass panels, gradient buttons with a subtle shine, floating background orbs that drift slowly.
- Every interaction gives immediate feedback — nothing dead-ends.
- Money shown as MAD, formatted clearly and consistently.

## Demo mode

Runs fully in the browser with **no sign-in and no API key**. Seed data loads on first visit, state persists in `localStorage`, and all features (add / edit / delete transactions, edit budgets, AI-category suggestion, notifications, logout) work locally.

Demo mode activates automatically when `VITE_CLERK_PUBLISHABLE_KEY` is **not** set. Set the key (plus a Clerk instance) to switch to the authenticated, server-backed experience.

## Stack

- `artifacts/finza` — React + Vite web app, TanStack Query, Tailwind-style dark theme
- `artifacts/api-server` — Express 5 API (Drizzle + Postgres)
- Clerk for authentication (optional in demo mode)
- pnpm workspace monorepo

## Run locally

```bash
pnpm install

# Web app (requires PORT and BASE_PATH)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/finza run dev

# Full typecheck across all packages
pnpm run typecheck
```

## Repo layout

- `artifacts/finza` — the product web app (alias `@` → `src`)
- `artifacts/api-server` — Express API
- `lib/api-spec` — OpenAPI contract source of truth
- `lib/api-client-react`, `lib/api-zod` — generated clients (do not hand-edit)
- `lib/db` — Drizzle/Postgres schemas
