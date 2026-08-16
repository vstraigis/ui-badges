# use-live-poll

A tiny React hook for consuming a Server-Sent Events (SSE) endpoint that pushes live-updating poll/tally results — no backend or transport assumptions baked in beyond "a URL that emits SSE messages shaped like `{ tally, totalVotes }`".

## Install

```sh
npm install use-live-poll
```

## Usage

```tsx
import { useLivePoll } from "use-live-poll";

function LiveResults({ streamUrl, initialTally, initialTotalVotes }) {
  const { data, connected, error } = useLivePoll(streamUrl, {
    initialData: { tally: initialTally, totalVotes: initialTotalVotes },
  });

  return (
    <div>
      {!connected && <p>Reconnecting…</p>}
      {error && <p>Failed to parse update: {error.message}</p>}
      {data && <Results tally={data.tally} totalVotes={data.totalVotes} />}
    </div>
  );
}
```

## API

```ts
function useLivePoll<TTally = Record<string, number>>(
  url: string,
  options?: {
    initialData?: { tally: TTally; totalVotes: number };
    parse?: (raw: string) => { tally: TTally; totalVotes: number };
  },
): {
  data: { tally: TTally; totalVotes: number } | undefined;
  connected: boolean;
  error: Error | undefined;
};
```

- `initialData` — shown before the first SSE message arrives (e.g. server-rendered data).
- `parse` — override how each `data:` payload string is turned into a snapshot. Defaults to `JSON.parse`.
- The hook opens a `new EventSource(url)` on mount and closes it on unmount or `url` change.
