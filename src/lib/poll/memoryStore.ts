import { DuplicateVoteError, InvalidOptionError } from "./errors";
import type { PollStore } from "./store";
import type { Poll, Tally, TallyListener, TallySnapshot, Unsubscribe } from "./types";

export class InMemoryPollStore implements PollStore {
  private readonly poll: Poll;
  private readonly tally: Tally;
  private readonly voters = new Set<string>();
  private readonly listeners = new Set<TallyListener>();

  constructor(poll: Poll) {
    this.poll = poll;
    this.tally = Object.fromEntries(poll.options.map((option) => [option.id, 0]));
  }

  async getTally(pollId: string): Promise<TallySnapshot> {
    return this.snapshot(pollId);
  }

  async registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot> {
    if (!(optionId in this.tally)) {
      throw new InvalidOptionError(optionId);
    }
    if (this.voters.has(voterId)) {
      throw new DuplicateVoteError();
    }

    this.voters.add(voterId);
    this.tally[optionId] += 1;

    const snapshot = this.snapshot(pollId);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
    return snapshot;
  }

  subscribe(_pollId: string, listener: TallyListener): Unsubscribe {
    this.listeners.add(listener);
    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.listeners.delete(listener);
    };
  }

  private snapshot(pollId: string): TallySnapshot {
    const totalVotes = Object.values(this.tally).reduce((sum, count) => sum + count, 0);
    return { pollId, tally: { ...this.tally }, totalVotes };
  }
}
