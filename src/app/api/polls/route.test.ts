import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SEED_POLL_ID } from "@/lib/poll/definition";
import { GET, POST } from "./route";

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/polls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/polls", () => {
  it("includes the seed poll", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.polls.some((poll: { id: string }) => poll.id === SEED_POLL_ID)).toBe(true);
  });
});

describe("POST /api/polls", () => {
  it("creates a poll that then appears in the list", async () => {
    const res = await POST(postRequest({ question: "Best IDE?", options: ["Vim", "Emacs"] }));
    expect(res.status).toBe(201);

    const created = (await res.json()).poll;
    expect(created.question).toBe("Best IDE?");

    const listRes = await GET();
    const { polls } = await listRes.json();
    expect(polls.some((poll: { id: string }) => poll.id === created.id)).toBe(true);
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(postRequest({ question: "", options: ["Only one"] }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
