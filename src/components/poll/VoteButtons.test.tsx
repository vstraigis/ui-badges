import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoteButtons } from "./VoteButtons";
import type { PollOption } from "@/lib/poll/types";

const OPTIONS: PollOption[] = [
  { id: "a", label: "Option A" },
  { id: "b", label: "Option B" },
];

describe("VoteButtons", () => {
  it("calls onVote with the clicked option's id", async () => {
    const onVote = vi.fn();
    render(<VoteButtons options={OPTIONS} disabled={false} onVote={onVote} />);

    await userEvent.click(screen.getByRole("button", { name: "Option B" }));

    expect(onVote).toHaveBeenCalledWith("b");
  });

  it("disables all buttons when disabled is true", () => {
    render(<VoteButtons options={OPTIONS} disabled onVote={vi.fn()} />);

    for (const option of OPTIONS) {
      expect(screen.getByRole("button", { name: option.label })).toBeDisabled();
    }
  });
});
