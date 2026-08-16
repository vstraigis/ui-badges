import { describe, expect, it, vi } from "vitest";
import { getPollStore } from "@/lib/poll/store";
import { GET } from "./route";

function ctx(pollId: string) {
  return { params: Promise.resolve({ pollId }) };
}

async function readOneChunk(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe("GET /api/polls/[pollId]/stream", () => {
  it("streams the current tally as an SSE event", async () => {
    const poll = await getPollStore().createPoll({ question: "Stream me", options: ["A", "B"] });
    const res = await GET(new Request("http://localhost/api/polls/x/stream"), ctx(poll.id));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const chunk = await readOneChunk(res);
    expect(chunk).toContain("data: ");
    expect(chunk).toContain(poll.id);
  });

  it("returns 404 for an unknown poll", async () => {
    const res = await GET(new Request("http://localhost/api/polls/x/stream"), ctx("does-not-exist"));
    expect(res.status).toBe(404);
  });

  it("unsubscribes when the stream is cancelled", async () => {
    const unsubscribe = vi.fn();
    const poll = await getPollStore().createPoll({ question: "Cancel me", options: ["A", "B"] });
    const subscribeSpy = vi.spyOn(await getPollStore(), "subscribe").mockReturnValue(unsubscribe);

    const res = await GET(new Request("http://localhost/api/polls/x/stream"), ctx(poll.id));
    const reader = res.body!.getReader();
    await reader.read();
    await reader.cancel();

    expect(unsubscribe).toHaveBeenCalled();
    subscribeSpy.mockRestore();
  });
});
