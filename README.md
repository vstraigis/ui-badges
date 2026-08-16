# Live Poll

Anyone can create a poll; every poll is visible to everyone. Built to demonstrate a real-time,
event-driven serverless backend and a tested, installable frontend on Next.js 16.

- **Backend**: a storage interface with two implementations — in-memory for local dev/tests, and
  Redis-backed for production. Votes are deduped per-voter via a cookie. Results push to the
  browser over Server-Sent Events, so votes appear live with no polling on the client.
- **Frontend**: a small set of tested, composable components, consuming a generic `useLivePoll`
  React hook published as its own npm package at [`packages/use-live-poll`](./packages/use-live-poll).
- **PWA**: the app is installable (name, icons, theme color). No offline service worker — not
  worth the added build complexity for an app this size.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no `.env.local`, the app falls back to
an in-memory poll store — no external account needed to develop or run tests.

```bash
npm test        # vitest, runs against the in-memory store
npm run typecheck
npm run lint
npm run build
```

The homepage lists every poll as a link. Click "Create a poll" (`/new`) to add a new one — it's
visible to everyone immediately, no account needed. Open a poll in two browser windows, vote in
one, and watch results update live in the other. Voting again from the same browser is treated
as "already voted," scoped per poll.

## API

- `GET /api/polls` — list every poll.
- `POST /api/polls` — create a poll.
- `GET /api/polls/[pollId]` — a poll's definition plus its current tally.
- `POST /api/polls/[pollId]/vote` — cast a vote.
- `GET /api/polls/[pollId]/stream` — live tally updates via Server-Sent Events.

## Connecting a real Redis store

Local dev and CI don't need this — it's only for a deployed environment where multiple
serverless instances need to share vote state.

1. Create a free database at [Upstash](https://console.upstash.com/redis) and copy its REST URL and token.
2. Copy `.env.local.example` to `.env.local` and fill in `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. Restart `npm run dev` — it picks the Redis-backed store automatically once both env vars are set.

## CI/CD

`.github/workflows/ci.yml` runs lint, typecheck, tests, and a production build on every push/PR
to `main`. Vercel is connected to the repo, so every push to `main` that passes CI deploys to
production automatically — no manual deploy step.

## Publishing `use-live-poll`

The hook in [`packages/use-live-poll`](./packages/use-live-poll) has no dependency on this app's
types, so it can be published standalone:

```bash
cd packages/use-live-poll
npm run build
npm publish --access public
```
