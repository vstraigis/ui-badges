import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsBars } from "./ResultsBars";
import type { PollOption } from "@/lib/poll/types";

const OPTIONS: PollOption[] = [
  { id: "a", label: "Option A" },
  { id: "b", label: "Option B" },
];

describe("ResultsBars", () => {
  it("renders each option with its vote count and percentage", () => {
    render(<ResultsBars options={OPTIONS} tally={{ a: 3, b: 1 }} totalVotes={4} />);

    expect(screen.getByLabelText("Option A: 75%")).toBeInTheDocument();
    expect(screen.getByLabelText("Option B: 25%")).toBeInTheDocument();
    expect(screen.getByText("3 votes")).toBeInTheDocument();
    expect(screen.getByText("1 vote")).toBeInTheDocument();
  });

  it("renders 0% for every option with no NaN when there are no votes yet", () => {
    render(<ResultsBars options={OPTIONS} tally={{ a: 0, b: 0 }} totalVotes={0} />);

    expect(screen.getByLabelText("Option A: 0%")).toBeInTheDocument();
    expect(screen.getByLabelText("Option B: 0%")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
