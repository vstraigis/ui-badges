import { describe, expect, it } from "vitest";
import { getOrCreateVoterId, VOTER_COOKIE_NAME } from "./voterId";

describe("getOrCreateVoterId", () => {
  it("returns the existing id unchanged when the cookie is present", () => {
    const cookieStore = {
      get: (name: string) => (name === VOTER_COOKIE_NAME ? { value: "existing-id" } : undefined),
    };

    const result = getOrCreateVoterId(cookieStore);

    expect(result).toEqual({ id: "existing-id", isNew: false });
  });

  it("generates a new uuid-shaped id and marks isNew when the cookie is absent", () => {
    const cookieStore = { get: () => undefined };

    const result = getOrCreateVoterId(cookieStore);

    expect(result.isNew).toBe(true);
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("generates a different id on each call when absent", () => {
    const cookieStore = { get: () => undefined };

    const first = getOrCreateVoterId(cookieStore);
    const second = getOrCreateVoterId(cookieStore);

    expect(first.id).not.toBe(second.id);
  });
});
