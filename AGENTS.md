# AGENTS.md

Replit-originated pnpm workspace monorepo: a dark-theme personal finance tracker (MAD currency). Landing page, dashboard, transaction CRUD with AI categorization, budgets, AI insight cards.

## Run & Verify

- `pnpm install` (must use pnpm; the root `preinstall` script refuses npm/yarn)
- `pnpm --filter @workspace/api-server run dev` — Express 5 API (builds then starts)
- `pnpm run typecheck` — full typecheck across all packages (build runs this first)
- `pnpm run build` — typecheck + build all packages
- Format with prettier: `pnpm exec prettier --write <files>` (no root format script)

## Workspace layout

- `artifacts/finza` — React/Vite web app (the product). Aliases `@` -> `src`, `@assets` -> `attached_assets`
- `artifacts/api-server` — authenticated Express 5 API, esbuild CJS bundle to `dist/index.mjs`
- `artifacts/mockup-sandbox` — throwaway Vite mockup playground (not part of the product)
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema` — Drizzle/PostgreSQL schemas
- `lib/api-client-react`, `lib/api-zod` — GENERATED code, do not edit by hand
- `scripts` — misc tsx scripts/tools

## Critical env-var gotchas (running the apps fails without these)

These are NOT documented in any `.env.example`; each service throws at startup if missing:

- `artifacts/finza/vite.config.ts` REQUIRES `PORT` and `BASE_PATH` (throws otherwise). Also reads `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PROXY_URL`.
- `artifacts/api-server` REQUIRES `PORT` and `DATABASE_URL`; reads `ANTHROPIC_API_KEY` (AI insights), `CLERK_SECRET_KEY`, `LOG_LEVEL`, `NODE_ENV`.
- `lib/db/src/index.ts` throws without `DATABASE_URL` (Postgres).

## Codegen & schema

- Edit `lib/api-spec/openapi.yaml`, then run `pnpm --filter @workspace/api-spec run codegen` (Orval) to regenerate `lib/api-client-react` and `lib/api-zod`. The generated files are committed; regenerate before relying on API changes.
- DB schema changes (dev): `pnpm --filter @workspace/db run push` (or `push-force`).

## Stack quirks

- Auth is Clerk. Public landing/demo browseable; persisted data needs a signed-in Clerk session.
- OpenAPI date inputs generate as JS `Date`; convert to `YYYY-MM-DD` before writing to Drizzle date columns.
- Keep Clerk CSS layer import after the layer declaration; use generated publishable-key env in the Vite client.
- The finza Vite config's Replit cartographer/dev-banner plugins only activate when `REPL_ID` is set (skip on local).
- pnpm-workspace.yaml sets `minimumReleaseAge: 1440` (supply-chain defense) — do not disable; use `minimumReleaseAgeExclude` only for trusted packages.

## Conventions

- MAD-first product; dark "midnight-lagoon" palette with turquoise signal accents.
- Validation via Zod (`zod/v4`) and `drizzle-zod`, API client from `@tanstack/react-query`.
