import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getPollStore } from "@/lib/poll/store";
import { InMemoryPollStore } from "@/lib/poll/memoryStore";
import { POLL } from "@/lib/poll/definition";

vi.mock("@/lib/poll/store", () => {
  return {
    getPollStore: vi.fn(),
  };
});

describe("GET /api/poll", () => {
  beforeEach(() => {
    vi.mocked(getPollStore).mockReturnValue(new InMemoryPollStore(POLL));
  });

  it("returns 200 with the poll definition and a zeroed tally on a fresh store", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.poll).toEqual(POLL);
    expect(body.pollId).toBe(POLL.id);
    expect(body.totalVotes).toBe(0);
    for (const option of POLL.options) {
      expect(body.tally[option.id]).toBe(0);
    }
  });
});
