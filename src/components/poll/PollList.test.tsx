import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PollList } from "./PollList";
import type { Poll } from "@/lib/poll/types";

const POLLS: Poll[] = [
  { id: "poll-1", question: "Favorite language?", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] },
  { id: "poll-2", question: "Best editor?", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] },
];

describe("PollList", () => {
  it("renders a link to each poll", () => {
    render(<PollList polls={POLLS} />);

    const linkOne = screen.getByRole("link", { name: "Favorite language?" });
    expect(linkOne).toHaveAttribute("href", "/polls/poll-1");

    const linkTwo = screen.getByRole("link", { name: "Best editor?" });
    expect(linkTwo).toHaveAttribute("href", "/polls/poll-2");
  });

  it("shows an empty-state message when there are no polls", () => {
    render(<PollList polls={[]} />);

    expect(screen.getByText(/No polls yet/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
