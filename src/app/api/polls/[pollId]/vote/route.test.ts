import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { getPollStore } from "@/lib/poll/store";
import { VOTER_COOKIE_NAME } from "@/lib/poll/voterId";
import { POST } from "./route";

async function newPoll() {
  return getPollStore().createPoll({ question: "Pick one", options: ["A", "B"] });
}

function voteRequest(pollId: string, optionId: string | undefined, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie: `${VOTER_COOKIE_NAME}=${cookie}` } : {}),
    },
    body: JSON.stringify({ optionId }),
  });
}

function ctx(pollId: string) {
  return { params: Promise.resolve({ pollId }) };
}

describe("POST /api/polls/[pollId]/vote", () => {
  it("registers a vote and sets a voter cookie when none was present", async () => {
    const poll = await newPoll();
    const res = await POST(voteRequest(poll.id, poll.options[0].id), ctx(poll.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tally[poll.options[0].id]).toBe(1);
    expect(res.cookies.get(VOTER_COOKIE_NAME)).toBeDefined();
  });

  it("does not overwrite an existing voter cookie", async () => {
    const poll = await newPoll();
    const res = await POST(voteRequest(poll.id, poll.options[0].id, "existing-voter"), ctx(poll.id));

    expect(res.status).toBe(200);
    expect(res.cookies.get(VOTER_COOKIE_NAME)).toBeUndefined();
  });

  it("rejects an unknown option with 400", async () => {
    const poll = await newPoll();
    const res = await POST(voteRequest(poll.id, "not-an-option"), ctx(poll.id));
    expect(res.status).toBe(400);
  });

  it("rejects a second vote from the same voter with 409", async () => {
    const poll = await newPoll();
    const voterId = "repeat-voter";
    await POST(voteRequest(poll.id, poll.options[0].id, voterId), ctx(poll.id));
    const second = await POST(voteRequest(poll.id, poll.options[1].id, voterId), ctx(poll.id));

    expect(second.status).toBe(409);
  });

  it("returns 404 for an unknown poll", async () => {
    const res = await POST(voteRequest("does-not-exist", "a"), ctx("does-not-exist"));
    expect(res.status).toBe(404);
  });
});
