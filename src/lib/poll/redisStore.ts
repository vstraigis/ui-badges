import type { Redis } from "@upstash/redis";
import { DuplicateVoteError, InvalidOptionError, PollNotFoundError } from "./errors";
import { buildPollFromInput, type CreatePollInput } from "./pollInput";
import type { PollStore } from "./store";
import type { Poll, Tally, TallyListener, TallySnapshot, Unsubscribe } from "./types";

const SUBSCRIBE_POLL_INTERVAL_MS = 1500;
const POLL_DEFINITIONS_KEY = "polls:definitions";
const POLL_ORDER_KEY = "polls:order";

/**
 * Upstash's REST API has no persistent SUBSCRIBE socket, so subscribe() here
 * polls getTally() on an interval and only notifies listeners when the
 * snapshot actually changed. The PollStore interface hides this from callers
 * (e.g. the SSE route) - they just see push notifications either way.
 */
export class RedisPollStore implements PollStore {
  private readonly redis: Redis;
  private readonly seedPoll: Poll | undefined;
  private seeded = false;

  constructor(redis: Redis, seedPoll?: Poll) {
    this.redis = redis;
    this.seedPoll = seedPoll;
  }

  async listPolls(): Promise<Poll[]> {
    await this.ensureSeeded();

    const ids = await this.redis.lrange<string>(POLL_ORDER_KEY, 0, -1);
    if (ids.length === 0) return [];

    const defs = await Promise.all(ids.map((id) => this.redis.hget<Poll>(POLL_DEFINITIONS_KEY, id)));
    return defs.filter((def): def is Poll => def !== null);
  }

  async getPoll(pollId: string): Promise<Poll | undefined> {
    await this.ensureSeeded();

    const poll = await this.redis.hget<Poll>(POLL_DEFINITIONS_KEY, pollId);
    return poll ?? undefined;
  }

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const poll = buildPollFromInput(input);
    await this.persistPoll(poll);
    return poll;
  }

  async getTally(pollId: string): Promise<TallySnapshot> {
    const poll = await this.getPoll(pollId);
    if (!poll) {
      throw new PollNotFoundError(pollId);
    }
    return this.readTally(poll);
  }

  async registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot> {
    const poll = await this.getPoll(pollId);
    if (!poll) {
      throw new PollNotFoundError(pollId);
    }
    if (!poll.options.some((option) => option.id === optionId)) {
      throw new InvalidOptionError(optionId);
    }

    // SADD's return value (1 = newly added, 0 = already a member) is the
    // atomic compare-and-set for "has this voter already voted" - no lock needed.
    const added = await this.redis.sadd(this.votersKey(pollId), voterId);
    if (added === 0) {
      throw new DuplicateVoteError();
    }

    await this.redis.hincrby(this.tallyKey(pollId), optionId, 1);
    return this.readTally(poll);
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
        // Transient network error, or the poll no longer exists - the next tick will retry.
      }
    };

    const timer = setInterval(tick, SUBSCRIBE_POLL_INTERVAL_MS);

    return () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
    };
  }

  private async ensureSeeded(): Promise<void> {
    if (this.seeded || !this.seedPoll) return;

    const added = await this.redis.hsetnx(POLL_DEFINITIONS_KEY, this.seedPoll.id, this.seedPoll);
    if (added === 1) {
      await this.redis.lpush(POLL_ORDER_KEY, this.seedPoll.id);
    }
    this.seeded = true;
  }

  private async persistPoll(poll: Poll): Promise<void> {
    await this.redis.hset(POLL_DEFINITIONS_KEY, { [poll.id]: poll });
    await this.redis.lpush(POLL_ORDER_KEY, poll.id);
  }

  private async readTally(poll: Poll): Promise<TallySnapshot> {
    const raw = (await this.redis.hgetall<Record<string, number>>(this.tallyKey(poll.id))) ?? {};
    const tally: Tally = {};
    let totalVotes = 0;
    for (const option of poll.options) {
      const count = Number(raw[option.id] ?? 0);
      tally[option.id] = count;
      totalVotes += count;
    }
    return { pollId: poll.id, tally, totalVotes };
  }

  private tallyKey(pollId: string): string {
    return `poll:${pollId}:tally`;
  }

  private votersKey(pollId: string): string {
    return `poll:${pollId}:voters`;
  }
}
