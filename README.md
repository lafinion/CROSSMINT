# Crossmint megaverse — reproducible skeleton

This repository contains a focused, testable TypeScript/Node.js skeleton for the Crossmint
megaverse challenge. It implements a resilient HTTP client, an orchestrator that builds the
map (Phase 1 and Phase 2), retry/backoff and concurrency limiting, and a comprehensive test
suite that covers unit and integration-like flows.

## QUICK START

- `npm run prepare:env` — copy `.env.local.example` to `.env.local` and install deps
- `npm run phase1` — draw X pattern (supports `--size` and `--dry-run`)
- `npm run phase2` — build from goal map (supports `--dry-run` and `--concurrency`)
- `npm run validate` — validate current map on server
- `npm run test:all` — run all Jest tests
- `npm run test:unit` — run unit tests only (`test/scenario/unit`)
- `npm run test:api` — run API tests only (`test/scenario/api`)
- `npm run test:integration` — run integration tests only (`test/scenario/integration`)
- `npm run test:services` — run service/orchestrator tests only (`test/scenario/services`)

Notes about passing flags: when using `npm run` add a single `--` then the positional arg or flags
as shown above; many shells also accept `npm run phase1 -- 15 --dry-run` which forwards both
`15` and `--dry-run` to the script.

TL;DR — quick steps

1. Copy configuration to `./.env.local` (example below).
2. Install dependencies: `npm ci`.
3. Run tests: `npm test`.
4. Run scripts: `npm run phase1 -- <size>`, `npm run phase2`, `npm run validate`.

Prerequisites

- Node.js v20.x (tested with v20.11.0)
- npm v10.x (tested with 10.2.4)

Install

```bash
git clone <your-repo-url>
cd CROSSMINT
npm ci
```

Configuration

Prepare a local configuration file so a reviewer can run the project with a
single copy-and-run sequence. A ready template is provided as
`.env.local.example` — copy it to `.env.local` and adjust values if needed:

```bash
cp .env.local.example .env.local
# (edit .env.local if you need to change values)
```

The example contains reasonable defaults for review runs:

```
BASE_URL=https://challenge.crossmint.com
CANDIDATE_ID=0f8c74ac-53a1-4b9b-87c1-c43acad78a3d
CONCURRENCY=5
RETRY_MAX_ATTEMPTS=5
RETRY_BASE_DELAY_MS=200
```

Notes:

- Keep `.env.local` private; do not commit it.
- Use `CONCURRENCY=1` for the first real run if you hit rate limits.

One-click reviewer flow (prepare env, run Phase 1, run Phase 2)

```bash
# prepare environment and install deps
npm run prepare:env

# Phase 1 — draw X pattern (example size 15)
npm run phase1 -- 15 --dry-run
npm run phase1 -- 15

# Phase 2 — build from goal map
npm run phase2 -- --dry-run
npm run phase2

# Validate
npm run validate
```

Why `.env.local`?

This repo uses `dotenv` to load local environment values. The file is intentionally local (not
committed); keep your own `.env.local` when running locally or CI.

Implementation notes

- HTTP client: lightweight `ApiClient` wraps `fetch` and uses `retryWithExponentialBackoff`.
- Crossmint client: `CrossmintClient` implements domain operations (`createPolyanetAt`, `createSoloonAt`, `createComethAt`, `fetchGoalMap`, `validateSolution`) and uses idempotent helpers to treat 400/409 as success for creates and 404 as success for deletes.
- Orchestrator: provides `drawXPattern` and `buildMegaverseFromGoalMap`. Both operations support `dryRun` and bounded concurrency.
- Utilities: `utils.retryWithExponentialBackoff` and `createLimiter` (a simple bounded concurrency queue).
- Tests: most business-critical flows are covered (retry, idempotency, orchestrator behavior, concurrency limits, cleanup script, CLI smoke tests).

Flags and common options

- `--dry-run` — prints the actions instead of making POST/DELETE requests.
- `--concurrency=<n>` — override the `CONCURRENCY` value from `.env.local` for a run.

Idempotency and error handling

- Create endpoints (`POST`) treat 400/409 responses as non-fatal (object may already exist).
- Delete endpoints (`DELETE`) treat 404 as non-fatal (object may already be absent).
- Retry/backoff handles 429 and 5xx responses and network failures with exponential backoff.

Testing

- Run the full suite: `npm test`.
- Tests are located in `test/scenario` and cover unit and integration-like scenarios. The code is organized under `test/api` and `test/services` in this skeleton.

Troubleshooting

- If you hit rate limits (429), reduce `CONCURRENCY` in `.env.local` and re-run.
- If `validate` returns `{ "solved": false }`, run `npm run phase2 -- --dry-run` to inspect the operations, then run `npm run phase2` to apply changes, and finally `npm run validate`.

Publishing and evaluation

- Prepare a public GitHub repository containing this code and a short explanation of any deviations from the challenge instructions.
- Include instructions in this `README.md` for how to reproduce your run (Node/npm versions, `.env.local` contents).

If you want, I can:

- polish this README into a reviewer-friendly markdown (add screenshots/examples),
- create a `.env.local` sample (if you prefer a committed template named `.env.local.example`),
- and prepare a GitHub-ready commit history and instructions for publishing.

