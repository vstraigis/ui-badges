import { Redis } from "@upstash/redis";
import type { TallyListener, TallySnapshot, Unsubscribe } from "./types";
import { POLL } from "./definition";
import { InMemoryPollStore } from "./memoryStore";
import { RedisPollStore } from "./redisStore";

export interface PollStore {
  getTally(pollId: string): Promise<TallySnapshot>;
  registerVote(pollId: string, optionId: string, voterId: string): Promise<TallySnapshot>;
  subscribe(pollId: string, listener: TallyListener): Unsubscribe;
}

let cachedStore: PollStore | undefined;

export function getPollStore(): PollStore {
  if (!cachedStore) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    cachedStore = url && token ? new RedisPollStore(new Redis({ url, token }), POLL) : new InMemoryPollStore(POLL);
  }
  return cachedStore;
}
