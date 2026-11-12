# Masar

Masar notices reproductive-health signals early, shows people how things are changing, turns that into a choice their doctor reviews, and reports to the health system whether it happened earlier and fairly.

Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment. The pilot environment uses synthetic records; it is not connected to Malaffi, Health Age or any real record.

## Run it

```bash
npm install
npm run dev
```

The product is at http://localhost:3000. Its sign-in page explains that UAE PASS and organisation sign-in connect at pilot integration.

## Signing in

Until those identity providers are connected, each account signs in with a signed login link. Links expire after 30 days and only work with the server's `SESSION_SECRET`.

Two ways to get them, neither linked from the product:

- **Script:** `npm run login-links` prints a link for every account. For a deployed server: `BASE_URL=https://your-host SESSION_SECRET=... npm run login-links`.
- **Access page:** `/access` lists the same links with copy buttons, can load the demo story (Noura has asked her doctor to talk, Arjun has shared, Maryam starts fresh) and can reset all data. It is open in development; in production it needs `ACCESS_KEY` and is opened as `/access?key=YOUR_KEY` (opening it without the key asks for the key). Its demo story button opens the interactive prototype at `/prototype`. It is hidden from search engines.

| Account | Role | Lands on |
|---|---|---|
| Noura Al Mansouri | Resident | `/me` |
| Arjun Nair | Resident | `/me` |
| Maryam Haddad | Resident | `/me` |
| Dr Layla Al Hashimi | Clinician | `/clinic` |
| Department of Health analyst | Health system | `/system` |

## Environment

| Variable | Needed | Purpose |
|---|---|---|
| `SESSION_SECRET` | Production | Signs sessions and login links. The server refuses to start sign-ins without it in production. |
| `ACCESS_KEY` | Production | Opens the `/access` page and `/prototype`. Without it, production shows that demo access is switched off. |
| `GEMINI_API_KEY` | Optional | Turns on the resident's assistant and automatic reading of uploaded reports. Without it, Masar uses its own written explanations. |
| `GEMINI_MODEL` | Optional | Gemini model name. Defaults to `gemini-2.5-flash`. |
| `GEMINI_MOCK` | Demo only | `1` with no key runs the journey's Gemini steps through a labelled mock. |
| `MASAR_DATA_DIR` | Optional | Where state and uploads are kept. Defaults to `.data/`. |

Copy `.env.example` to `.env.local` and fill it in.

## Deploying

Masar keeps its state in files (`.data/state.json` and `.data/uploads/`, or `MASAR_DATA_DIR`), so it needs a host with a **persistent disk** and **one running instance**. Set `SESSION_SECRET` and `ACCESS_KEY` (and `GEMINI_API_KEY` or `GEMINI_MOCK=1` if wanted) in the host's environment settings, never in the repository.

| Host | Fits? | Notes |
|---|---|---|
| Render, Railway or Fly.io | Yes, for the demo | Deploy `app/` with the `Dockerfile`, attach a disk/volume at `/data`, keep it to one instance. |
| A UAE-region VM or container service (Azure UAE North, AWS me-central-1, Oracle Abu Dhabi, Core42) | Yes, for a pilot | Same container. Needed once real health data is involved, because UAE health data must stay in the country. |
| Vercel or Netlify | Only the prototype | `/prototype` keeps its state in the browser and works anywhere. The live app's writes (consent, answers, uploads) would be lost: these hosts have no lasting disk. Moving the store to a database first would fix this. |

```bash
docker build -t masar .
docker run -p 3000:3000 -v masar-data:/data -e SESSION_SECRET=... -e ACCESS_KEY=... masar
```

Then open `/access?key=YOUR_KEY` (or `/access` and enter the key).

## AI

The rules decide; the AI explains. Gemini never raises a finding, invents a number or diagnoses: it explains what the rules found, helps the person prepare for their doctor, and reads uploaded reports. Every value it reads is checked by the person before it counts, and the doctor always has the original file. Sample reports for testing: `npm run samples` writes made-up PDFs to `public/samples/`.

## Where things are

| Path | What it holds |
|---|---|
| `src/lib/signals.ts` | Signal rules, each with evidence, limits, options and questions |
| `src/lib/trajectory.ts` | Normal variation vs meaningful change; factors that can and can't change |
| `src/lib/population.ts` | The three resident accounts and 10,000 generated residents (fixed seed) |
| `src/lib/evidence.ts` | The simulated pilot behind the evidence and safety report |
| `src/lib/accounts.ts` | Accounts and signed login links |
| `src/server/ai/` | Gemini client, the resident's assistant (with its guardrails) and the report reader |
| `src/server/` | Sessions, consent-checked views, server actions, access check, stored state |
| `src/app/` | Product site, `/sign-in`, `/auth/[token]`, `/me`, `/clinic`, `/system`, `/access` |

Account state is stored in `.data/state.json` (ignored by git); swap `src/server/store.ts` for a database behind the same functions.

## Checks

```bash
npm run check
```
