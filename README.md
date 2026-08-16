# Live Poll

A single live poll, built to demonstrate a real-time, event-driven serverless backend and a tested, installable frontend on Next.js 16.

- **Backend**: a `PollStore` interface with two implementations — an in-memory store for local dev/tests, and a Redis-backed store (via [Upstash](https://upstash.com), REST-based and serverless-friendly) for production. Votes are deduped per-voter via a cookie + an atomic Redis `SADD`. Results are pushed to the browser over Server-Sent Events (`/api/poll/stream`), so votes appear live with no polling on the client.
- **Frontend**: a small set of tested, composable components (`ResultsBars`, `VoteButtons`, `VoteIsland`), consuming a generic `useLivePoll` React hook published as its own npm package at [`packages/use-live-poll`](./packages/use-live-poll) — the app dogfoods its own published dependency.
- **PWA**: `app/manifest.ts` makes the app installable (name, icons, theme color). There's no offline service worker — `@serwist/next`'s config wrapper only supports webpack, and Next.js 16 defaults to Turbopack for both `dev` and `build`; adding a separate build pipeline just for offline caching wasn't worth the complexity for this app.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no `.env.local`, the app automatically falls back to an in-memory poll store — no external account needed to develop or run tests.

```bash
npm test        # vitest, runs against the in-memory store
npm run typecheck
npm run lint
npm run build
```

Open the app in two browser windows side by side, vote in one, and watch the results update live in the other via SSE. Voting again from the same browser is treated as "already voted" (enforced server-side by a `voter_id` cookie, not just client state).

## Connecting a real Redis store

Local dev and CI never need this — it's only for a deployed environment where multiple serverless instances need to share vote state.

1. Create a free database at [Upstash](https://console.upstash.com/redis) and copy its REST URL and token.
2. Copy `.env.local.example` to `.env.local` and fill in `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. Restart `npm run dev` — `getPollStore()` picks the Redis-backed store automatically once both env vars are set.

## Deploying

Deployment is Vercel's git integration (connect the repo in the Vercel dashboard — no CLI/CI step needed):

1. Import the repo into Vercel.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the project's environment variables (Production and Preview).
3. Deploy. Vercel's Node runtime supports the streaming `Response` used by `/api/poll/stream` out of the box.

After deploying, repeat the two-window live-vote check against the production URL — this is the real test that updates propagate correctly across separate serverless instances, not just within one local process.

## Publishing `use-live-poll`

The hook in [`packages/use-live-poll`](./packages/use-live-poll) is written to have zero dependency on this app's types, so it can be published standalone:

```bash
cd packages/use-live-poll
npm run build
npm publish --access public
```

## CI

`.github/workflows/ci.yml` runs lint, typecheck, tests, and a production build on every push/PR to `main` — all against the in-memory store, so no secrets are required in CI.
