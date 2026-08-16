export const VOTER_COOKIE_NAME = "voter_id";

export interface VoterCookieReader {
  get(name: string): { value: string } | undefined;
}

export interface VoterIdResult {
  id: string;
  isNew: boolean;
}

export function getOrCreateVoterId(cookieStore: VoterCookieReader): VoterIdResult {
  const existing = cookieStore.get(VOTER_COOKIE_NAME);
  if (existing) {
    return { id: existing.value, isNew: false };
  }
  return { id: crypto.randomUUID(), isNew: true };
}
