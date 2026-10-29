# Stack

- Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript 5.9 (`strict`)
- Tailwind CSS 4
- Prisma ORM 7.10 with `@prisma/adapter-libsql` (SQLite file in dev; Postgres for pilot). Client generated to `src/generated/prisma` (git-ignored).
- zod 4, bcryptjs 3
- i18n: built-in Next.js dictionaries + `next/root-params` (`[locale]` root segment), locale redirect in `src/proxy.ts`
- Cache Components **disabled** on purpose (per-user genetic data; see `next.config.ts`)
- pnpm 10, Node 20

Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before using an API (`middleware` is now `proxy`, `PageProps`/`LayoutProps` are global helpers, `params` is a Promise).

## Commands

```
Install:      pnpm install            # runs prisma generate
Dev:          pnpm dev
Build:        pnpm build
Typecheck:    pnpm typecheck          # next typegen && tsc --noEmit
Lint:         pnpm lint
DB generate:  pnpm db:generate
DB migrate:   pnpm db:migrate
DB seed:      pnpm db:seed
DB reset:     pnpm db:reset           # drops dev DB, re-migrates, re-seeds
Test:         pnpm test               # added in test phase (Vitest)
E2E:          pnpm test:e2e           # added in test phase (Playwright)
```
