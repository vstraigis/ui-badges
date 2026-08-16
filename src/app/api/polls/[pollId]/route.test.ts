import { describe, expect, it } from "vitest";
import { SEED_POLL_ID } from "@/lib/poll/definition";
import { GET } from "./route";

function ctx(pollId: string) {
  return { params: Promise.resolve({ pollId }) };
}

describe("GET /api/polls/[pollId]", () => {
  it("returns the poll with a tally for a known id", async () => {
    const res = await GET(new Request("http://localhost/api/polls/x"), ctx(SEED_POLL_ID));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.poll.id).toBe(SEED_POLL_ID);
    expect(body.totalVotes).toBeGreaterThanOrEqual(0);
    expect(body.tally).toBeDefined();
  });

  it("returns 404 for an unknown id", async () => {
    const res = await GET(new Request("http://localhost/api/polls/x"), ctx("does-not-exist"));
    expect(res.status).toBe(404);
  });
});
