# Stack

The product is `app/`. `yousr/` is an earlier prototype kept for reference only; it is not built or deployed.

## `app/` (Masar)

- Next.js 16.4 (App Router, Cache Components, Turbopack), React 19.3, TypeScript (`strict`)
- Tailwind CSS 4, Recharts
- No database: state is a JSON file at `.data/state.json` and uploads in `.data/uploads/` (`MASAR_DATA_DIR` moves both). The store is behind `src/server/store.ts`, so a database can replace it later.
- Gemini over REST, no SDK (`src/server/ai/gemini.ts`), optional: `GEMINI_API_KEY`, or `GEMINI_MOCK=1` for a labelled mock.
- Sign-in by HMAC-signed login links (`SESSION_SECRET`); demo access behind `ACCESS_KEY` in production.
- English and Arabic through `t(lang, text)` and `src/lib/i18n-ar.ts`.
- npm, Node 20

Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before using an API (`middleware` is now `proxy`, `PageProps`/`LayoutProps` are global helpers, `params` is a Promise).

## Commands (run in `app/`)

```
Install:   npm install
Dev:       npm run dev
Build:     npm run build
Start:     npm run start
Lint:      npm run lint
Checks:    npm run check          # story, path, privacy, AI, journey, dashboard and experience suites
Typecheck: npx tsc --noEmit
```
