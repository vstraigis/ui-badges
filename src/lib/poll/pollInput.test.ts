import { describe, expect, it } from "vitest";
import { InvalidPollError } from "./errors";
import { buildPollFromInput } from "./pollInput";

describe("buildPollFromInput", () => {
  it("builds a poll with a uuid-shaped id and trimmed question", () => {
    const poll = buildPollFromInput({ question: "  Best editor?  ", options: ["Vim", "Emacs"] });

    expect(poll.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(poll.question).toBe("Best editor?");
    expect(poll.options).toHaveLength(2);
  });

  it("slugifies option labels into ids", () => {
    const poll = buildPollFromInput({ question: "Q", options: ["Hello World!", "C++"] });

    expect(poll.options).toEqual([
      { id: "hello-world", label: "Hello World!" },
      { id: "c", label: "C++" },
    ]);
  });

  it("de-duplicates colliding option slugs", () => {
    const poll = buildPollFromInput({ question: "Q", options: ["Go!", "Go?"] });

    expect(poll.options[0].id).toBe("go");
    expect(poll.options[1].id).toBe("go-2");
    expect(poll.options[0].id).not.toBe(poll.options[1].id);
  });

  it("trims and drops empty option labels before validating", () => {
    const poll = buildPollFromInput({ question: "Q", options: ["  A  ", "", "  B  ", "   "] });

    expect(poll.options).toEqual([
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ]);
  });

  it("rejects an empty question", () => {
    expect(() => buildPollFromInput({ question: "   ", options: ["A", "B"] })).toThrow(InvalidPollError);
  });

  it("rejects a question longer than 200 characters", () => {
    expect(() => buildPollFromInput({ question: "x".repeat(201), options: ["A", "B"] })).toThrow(InvalidPollError);
  });

  it("rejects fewer than 2 non-empty options", () => {
    expect(() => buildPollFromInput({ question: "Q", options: ["Only one"] })).toThrow(InvalidPollError);
  });

  it("rejects more than 8 non-empty options", () => {
    const options = Array.from({ length: 9 }, (_, i) => `Option ${i}`);
    expect(() => buildPollFromInput({ question: "Q", options })).toThrow(InvalidPollError);
  });
});
