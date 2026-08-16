import type { Redis } from "@upstash/redis";
import { DuplicateVoteError, InvalidOptionError } from "./errors";
import type { PollStore } from "./store";
import type { Poll, Tally, TallyListener, TallySnapshot, Unsubscribe } from "./types";

const SUBSCRIBE_POLL_INTERVAL_MS = 1500;

export class RedisPollStore implements PollStore {
  private readonly redis: Redis;
  private readonly poll: Poll;

  constructor(redis: Redis, poll: Poll) {
    this.redis = redis;
    this.poll = poll;
  }

  async getTally(pollId: string): Promise<TallySnapshot> {
    const raw = (await this.redis.hgetall<Record<string, number>>(this.tallyKey(pollId))) ?? {};
    const tally: Tally = {};
    let totalVotes = 0;
    for (const option of this.poll.options) {
      const count = Number(raw[option.id] ?? 0);
      tally[option.id] = count;
      totalVotes += count;
    }
    return { pollId, tally, totalVotes };
  }

  async registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot> {
    if (!this.poll.options.some((option) => option.id === optionId)) {
      throw new InvalidOptionError(optionId);
    }

    const added = await this.redis.sadd(this.votersKey(pollId), voterId);
    if (added === 0) {
      throw new DuplicateVoteError();
    }

    await this.redis.hincrby(this.tallyKey(pollId), optionId, 1);
    return this.getTally(pollId);
  }

  subscribe(pollId: string, listener: TallyListener): Unsubscribe {
    let lastSerialized: string | undefined;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      try {
        const snapshot = await this.getTally(pollId);
        const serialized = JSON.stringify(snapshot);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          listener(snapshot);
        }
      } catch {
        // Network error - the next tick will retry.
      }
    };

    const timer = setInterval(tick, SUBSCRIBE_POLL_INTERVAL_MS);

    return () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
    };
  }

  private tallyKey(pollId: string): string {
    return `poll:${pollId}:tally`;
  }

  private votersKey(pollId: string): string {
    return `poll:${pollId}:voters`;
  }
}
