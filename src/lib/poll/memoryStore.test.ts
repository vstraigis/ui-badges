import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateVoteError, InvalidOptionError, PollNotFoundError } from "./errors";
import { InMemoryPollStore } from "./memoryStore";
import type { Poll } from "./types";

const SEED: Poll = {
  id: "seed-poll",
  question: "Seed question?",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
};

describe("InMemoryPollStore", () => {
  let store: InMemoryPollStore;

  beforeEach(() => {
    store = new InMemoryPollStore(SEED);
  });

  it("includes the seed poll in listPolls and getPoll", async () => {
    expect(await store.listPolls()).toEqual([SEED]);
    expect(await store.getPoll(SEED.id)).toEqual(SEED);
  });

  it("returns a zeroed tally shape for all options on first call", async () => {
    const snapshot = await store.getTally(SEED.id);
    expect(snapshot).toEqual({ pollId: SEED.id, tally: { a: 0, b: 0 }, totalVotes: 0 });
  });

  it("createPoll adds a poll visible via listPolls (newest first) and getPoll", async () => {
    const created = await store.createPoll({ question: "New?", options: ["X", "Y"] });

    expect(await store.getPoll(created.id)).toEqual(created);
    expect(await store.listPolls()).toEqual([created, SEED]);
  });

  it("increments the chosen option and total on a valid vote", async () => {
    const snapshot = await store.registerVote(SEED.id, "a", "voter-1");
    expect(snapshot).toEqual({ pollId: SEED.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("throws InvalidOptionError for an unknown option and leaves the tally unchanged", async () => {
    await expect(store.registerVote(SEED.id, "nope", "voter-1")).rejects.toThrow(InvalidOptionError);
    const snapshot = await store.getTally(SEED.id);
    expect(snapshot.totalVotes).toBe(0);
  });

  it("throws DuplicateVoteError on a second vote from the same voter and leaves the tally unchanged", async () => {
    await store.registerVote(SEED.id, "a", "voter-1");
    await expect(store.registerVote(SEED.id, "b", "voter-1")).rejects.toThrow(DuplicateVoteError);

    const snapshot = await store.getTally(SEED.id);
    expect(snapshot).toEqual({ pollId: SEED.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("throws PollNotFoundError from getTally/registerVote for an unknown pollId", async () => {
    await expect(store.getTally("unknown")).rejects.toThrow(PollNotFoundError);
    await expect(store.registerVote("unknown", "a", "voter-1")).rejects.toThrow(PollNotFoundError);
  });

  it("isolates votes/tallies between different polls", async () => {
    const other = await store.createPoll({ question: "Other?", options: ["X", "Y"] });

    await store.registerVote(SEED.id, "a", "voter-1");

    expect(await store.getTally(SEED.id)).toMatchObject({ totalVotes: 1 });
    expect(await store.getTally(other.id)).toMatchObject({ totalVotes: 0 });
  });

  it("notifies subscribers with the updated snapshot after a vote", async () => {
    const listener = vi.fn();
    store.subscribe(SEED.id, listener);

    await store.registerVote(SEED.id, "a", "voter-1");

    expect(listener).toHaveBeenCalledWith({ pollId: SEED.id, tally: { a: 1, b: 0 }, totalVotes: 1 });
  });

  it("does not notify a poll's subscribers about votes on a different poll", async () => {
    const other = await store.createPoll({ question: "Other?", options: ["X", "Y"] });
    const listener = vi.fn();
    store.subscribe(SEED.id, listener);

    await store.registerVote(other.id, "x", "voter-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(SEED.id, listener);
    unsubscribe();

    await store.registerVote(SEED.id, "a", "voter-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("allows calling unsubscribe twice without throwing", async () => {
    const unsubscribe = store.subscribe(SEED.id, vi.fn());
    expect(() => {
      unsubscribe();
      unsubscribe();
    }).not.toThrow();
  });
});
