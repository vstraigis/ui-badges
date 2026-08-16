import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoteIsland } from "./VoteIsland";
import type { Poll } from "@/lib/poll/types";

const POLL: Poll = {
  id: "test-poll",
  question: "Q?",
  options: [
    { id: "a", label: "Option A" },
    { id: "b", label: "Option B" },
  ],
};

const OTHER_POLL: Poll = {
  id: "other-poll",
  question: "Q2?",
  options: [
    { id: "a", label: "Option A" },
    { id: "b", label: "Option B" },
  ],
};

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeEventSource.instances.push(this);
  }

  close() {}

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

function renderIsland(alreadyVoted = false, poll: Poll = POLL) {
  return render(
    <VoteIsland
      poll={poll}
      initialTally={{ a: 0, b: 0 }}
      initialTotalVotes={0}
      streamUrl={`/api/polls/${poll.id}/stream`}
      voteUrl={`/api/polls/${poll.id}/vote`}
      alreadyVoted={alreadyVoted}
    />,
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  // @ts-expect-error - test double, not a full EventSource implementation
  globalThis.EventSource = FakeEventSource;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("VoteIsland", () => {
  it("renders the initial tally before any live update", () => {
    renderIsland();
    expect(screen.getByLabelText("Option A: 0%")).toBeInTheDocument();
  });

  it("disables voting and shows a thank-you after a successful vote", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ pollId: "test-poll", tally: { a: 1, b: 0 }, totalVotes: 1 }), { status: 200 }),
    );

    renderIsland();
    await userEvent.click(screen.getByRole("button", { name: "Option A" }));

    await waitFor(() => expect(screen.getByText("Thanks for voting!")).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      "/api/polls/test-poll/vote",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ optionId: "a" }) }),
    );
  });

  it("updates the results when the SSE stream pushes a new snapshot, without an extra fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderIsland();

    const source = FakeEventSource.instances[0];
    source.emitMessage({ pollId: "test-poll", tally: { a: 4, b: 1 }, totalVotes: 5 });

    await waitFor(() => expect(screen.getByLabelText("Option A: 80%")).toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a 409 (already voted) response as success, not an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "already voted" }), { status: 409 }));

    renderIsland();
    await userEvent.click(screen.getByRole("button", { name: "Option A" }));

    await waitFor(() => expect(screen.getByText("Thanks for voting!")).toBeInTheDocument());
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("does not treat a vote on one poll as a vote on another poll", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ pollId: "test-poll", tally: { a: 1, b: 0 }, totalVotes: 1 }), { status: 200 }),
    );

    renderIsland();
    await userEvent.click(screen.getByRole("button", { name: "Option A" }));
    await waitFor(() => expect(screen.getByText("Thanks for voting!")).toBeInTheDocument());

    renderIsland(false, OTHER_POLL);
    expect(screen.getByRole("button", { name: "Option A" })).toBeInTheDocument();
  });
});
