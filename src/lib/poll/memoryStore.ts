import { DuplicateVoteError, InvalidOptionError, PollNotFoundError } from "./errors";
import { buildPollFromInput, type CreatePollInput } from "./pollInput";
import type { PollStore } from "./store";
import type { Poll, Tally, TallyListener, TallySnapshot, Unsubscribe } from "./types";

export class InMemoryPollStore implements PollStore {
  private readonly polls = new Map<string, Poll>();
  private readonly tallies = new Map<string, Tally>();
  private readonly voters = new Map<string, Set<string>>();
  private readonly listeners = new Map<string, Set<TallyListener>>();

  constructor(seedPoll?: Poll) {
    if (seedPoll) {
      this.addPoll(seedPoll);
    }
  }

  async listPolls(): Promise<Poll[]> {
    return [...this.polls.values()].reverse();
  }

  async getPoll(pollId: string): Promise<Poll | undefined> {
    return this.polls.get(pollId);
  }

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const poll = buildPollFromInput(input);
    this.addPoll(poll);
    return poll;
  }

  async getTally(pollId: string): Promise<TallySnapshot> {
    return this.snapshot(pollId);
  }

  async registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot> {
    const tally = this.tallies.get(pollId);
    if (!tally) {
      throw new PollNotFoundError(pollId);
    }
    if (!(optionId in tally)) {
      throw new InvalidOptionError(optionId);
    }

    const voters = this.voters.get(pollId)!;
    if (voters.has(voterId)) {
      throw new DuplicateVoteError();
    }

    voters.add(voterId);
    tally[optionId] += 1;

    const snapshot = this.snapshot(pollId);
    for (const listener of this.listeners.get(pollId) ?? []) {
      listener(snapshot);
    }
    return snapshot;
  }

  subscribe(pollId: string, listener: TallyListener): Unsubscribe {
    let listeners = this.listeners.get(pollId);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(pollId, listeners);
    }
    listeners.add(listener);

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      listeners!.delete(listener);
    };
  }

  private addPoll(poll: Poll): void {
    this.polls.set(poll.id, poll);
    this.tallies.set(poll.id, Object.fromEntries(poll.options.map((option) => [option.id, 0])));
    this.voters.set(poll.id, new Set());
  }

  private snapshot(pollId: string): TallySnapshot {
    const tally = this.tallies.get(pollId);
    if (!tally) {
      throw new PollNotFoundError(pollId);
    }
    const totalVotes = Object.values(tally).reduce((sum, count) => sum + count, 0);
    return { pollId, tally: { ...tally }, totalVotes };
  }
}
