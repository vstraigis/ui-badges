import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getPollStore } from "@/lib/poll/store";
import type { PollStore } from "@/lib/poll/store";
import type { TallySnapshot } from "@/lib/poll/types";

vi.mock("@/lib/poll/store", () => {
  return {
    getPollStore: vi.fn(),
  };
});

function createTestStore(initial: TallySnapshot) {
  let unsubscribeCalled = false;
  const store: PollStore = {
    getTally: vi.fn().mockResolvedValue(initial),
    registerVote: vi.fn(),
    subscribe: vi.fn(() => {
      return () => {
        unsubscribeCalled = true;
      };
    }),
  };
  return { store, isUnsubscribed: () => unsubscribeCalled };
}

const INITIAL_SNAPSHOT: TallySnapshot = { pollId: "test-poll", tally: { a: 0, b: 0 }, totalVotes: 0 };

function makeRequest() {
  return new Request("http://localhost/api/poll/stream");
}

describe("GET /api/poll/stream", () => {
  beforeEach(() => {
    vi.mocked(getPollStore).mockReturnValue(createTestStore(INITIAL_SNAPSHOT).store);
  });

  it("responds with a text/event-stream content type", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("sends the current snapshot as the first SSE event", async () => {
    const res = await GET(makeRequest());
    const reader = res.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toBe(`data: ${JSON.stringify(INITIAL_SNAPSHOT)}\n\n`);
  });

  it("unsubscribes from the store when the stream is cancelled", async () => {
    const { store, isUnsubscribed } = createTestStore(INITIAL_SNAPSHOT);
    vi.mocked(getPollStore).mockReturnValue(store);

    const res = await GET(makeRequest());
    const reader = res.body!.getReader();
    await reader.read();
    await reader.cancel();

    expect(isUnsubscribed()).toBe(true);
  });
});
