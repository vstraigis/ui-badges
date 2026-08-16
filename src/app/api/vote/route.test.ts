import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getPollStore } from "@/lib/poll/store";
import { InMemoryPollStore } from "@/lib/poll/memoryStore";
import { POLL } from "@/lib/poll/definition";
import { VOTER_COOKIE_NAME } from "@/lib/poll/voterId";

vi.mock("@/lib/poll/store", () => {
  return {
    getPollStore: vi.fn(),
  };
});

function voteRequest(body: unknown, cookie?: string) {
  return new NextRequest("http://localhost/api/vote", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vote", () => {
  beforeEach(() => {
    vi.mocked(getPollStore).mockReturnValue(new InMemoryPollStore(POLL));
  });

  it("returns 200 with the updated tally and sets a voter cookie when none is present", async () => {
    const res = await POST(voteRequest({ optionId: POLL.options[0].id }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalVotes).toBe(1);

    const setCookie = res.cookies.get(VOTER_COOKIE_NAME);
    expect(setCookie?.value).toBeTruthy();
  });

  it("does not require setting a new cookie when one is already present", async () => {
    const res = await POST(voteRequest({ optionId: POLL.options[0].id }, `${VOTER_COOKIE_NAME}=existing-voter`));

    expect(res.status).toBe(200);
    expect(res.cookies.get(VOTER_COOKIE_NAME)).toBeUndefined();
  });

  it("returns 400 for an invalid optionId", async () => {
    const res = await POST(voteRequest({ optionId: "not-a-real-option" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 409 when the same voter votes twice", async () => {
    const cookie = `${VOTER_COOKIE_NAME}=same-voter`;

    const first = await POST(voteRequest({ optionId: POLL.options[0].id }, cookie));
    expect(first.status).toBe(200);

    const second = await POST(voteRequest({ optionId: POLL.options[1].id }, cookie));
    expect(second.status).toBe(409);
  });
});
