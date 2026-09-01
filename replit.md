# Finza

Finza is a dark-theme personal finance tracker for organizing MAD transactions, budgets, and practical AI insights.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finza` — React/Vite web app and Finza visual system
- `artifacts/api-server` — authenticated Express API and finance aggregation routes
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated hooks
- `lib/db/src/schema` — Drizzle/PostgreSQL schemas

## Architecture decisions

- Clerk is the authentication provider; the public landing and demo views remain browseable, while persisted API data requires a signed-in Clerk session.
- PostgreSQL with Drizzle is used for the initial persistence layer rather than Supabase.
- API client and Zod validation code are generated from the OpenAPI contract.
- The product is MAD-first and uses a dark midnight-lagoon palette with turquoise signal accents.

## Product

- Landing page with demo entry points and product story
- Dashboard with balance, income, spending, savings, weekly activity, and category breakdown
- Searchable, filterable, sortable transaction CRUD with AI categorization
- Monthly budget progress and editing
- Derived AI insight cards, settings, currency preference, and data export
- Responsive mobile navigation, loading skeletons, empty states, and retry errors

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Regenerate API clients after changing `lib/api-spec/openapi.yaml`.
- OpenAPI date inputs are generated as JavaScript `Date` values; convert them to `YYYY-MM-DD` before writing to Drizzle date columns.
- Keep Clerk's CSS layer import after the layer declaration and use the generated publishable-key environment variable in the Vite client.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
