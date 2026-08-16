import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryPollStore } from "./memoryStore";
import { DuplicateVoteError, InvalidOptionError } from "./errors";
import type { Poll } from "./types";

const POLL: Poll = {
  id: "test-poll",
  question: "Q?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
};

describe("InMemoryPollStore", () => {
  let store: InMemoryPollStore;

  beforeEach(() => {
    store = new InMemoryPollStore(POLL);
  });

  it("returns a zeroed tally shape for all options on first call", async () => {
    const snapshot = await store.getTally(POLL.id);
    expect(snapshot).toEqual({ pollId: POLL.id, tally: { a: 0, b: 0 }, totalVotes: 0 });
  });

  it("increments the chosen option and total on a valid vote", async () => {
    const snapshot = await store.registerVote(POLL.id, "a", "voter-1");
    expect(snapshot).toEqual({ pollId: POLL.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("throws InvalidOptionError for an unknown option and leaves the tally unchanged", async () => {
    await expect(store.registerVote(POLL.id, "nope", "voter-1")).rejects.toThrow(InvalidOptionError);
    const snapshot = await store.getTally(POLL.id);
    expect(snapshot.totalVotes).toBe(0);
  });

  it("throws DuplicateVoteError on a second vote from the same voter and leaves the tally unchanged", async () => {
    await store.registerVote(POLL.id, "a", "voter-1");
    await expect(store.registerVote(POLL.id, "b", "voter-1")).rejects.toThrow(DuplicateVoteError);

    const snapshot = await store.getTally(POLL.id);
    expect(snapshot).toEqual({ pollId: POLL.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("notifies subscribers with the updated snapshot after a vote", async () => {
    const listener = vi.fn();
    store.subscribe(POLL.id, listener);

    await store.registerVote(POLL.id, "a", "voter-1");

    expect(listener).toHaveBeenCalledWith({ pollId: POLL.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("stops notifying after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(POLL.id, listener);
    unsubscribe();

    await store.registerVote(POLL.id, "a", "voter-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("allows calling unsubscribe twice without throwing", async () => {
    const unsubscribe = store.subscribe(POLL.id, vi.fn());
    expect(() => {
      unsubscribe();
      unsubscribe();
    }).not.toThrow();
  });
});
