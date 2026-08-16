import { Redis } from "@upstash/redis";
import type { Poll, TallyListener, TallySnapshot, Unsubscribe } from "./types";
import type { CreatePollInput } from "./pollInput";
import { SEED_POLL } from "./definition";
import { InMemoryPollStore } from "./memoryStore";
import { RedisPollStore } from "./redisStore";

export interface PollStore {
  /** All polls, newest first. */
  listPolls(): Promise<Poll[]>;
  /** A single poll's definition, or undefined if pollId doesn't exist. */
  getPoll(pollId: string): Promise<Poll | undefined>;
  /** Creates and persists a new poll. Throws InvalidPollError on bad input. */
  createPoll(input: CreatePollInput): Promise<Poll>;
  /** Throws PollNotFoundError if pollId doesn't exist. */
  getTally(pollId: string): Promise<TallySnapshot>;
  registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot>;
  subscribe(pollId: string, listener: TallyListener): Unsubscribe;
}

// Next.js compiles Server Components and Route Handlers as separate module
// graphs ("layers"), so a plain module-scoped variable gets a distinct copy
// in each layer instead of one instance per process. That's fine for
// RedisPollStore (the shared state lives in Redis, not the JS instance), but
// it would silently fracture InMemoryPollStore's in-memory Maps in dev.
// globalThis is the actual Node.js global object, shared across every layer
// within the same process, so anchoring the singleton there keeps it single
// regardless of how many times this module is otherwise instantiated.
declare global {
  var __pollStore: PollStore | undefined;
}

export function getPollStore(): PollStore {
  if (!globalThis.__pollStore) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    globalThis.__pollStore =
      url && token
        ? new RedisPollStore(new Redis({ url, token }), SEED_POLL)
        : new InMemoryPollStore(SEED_POLL);
  }
  return globalThis.__pollStore;
}
