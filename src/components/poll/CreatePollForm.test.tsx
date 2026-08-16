import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { CreatePollForm } from "./CreatePollForm";

beforeEach(() => {
  push.mockClear();
  vi.restoreAllMocks();
});

describe("CreatePollForm", () => {
  it("starts with two empty option inputs and a disabled remove button", () => {
    render(<CreatePollForm />);

    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Option 3")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove option" })[0]).toBeDisabled();
  });

  it("adds up to 8 options and then disables the add button", async () => {
    render(<CreatePollForm />);
    const addButton = screen.getByRole("button", { name: "Add option" });

    for (let i = 0; i < 6; i++) {
      await userEvent.click(addButton);
    }

    expect(screen.getByLabelText("Option 8")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("submits the question and options, then navigates to the created poll", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ poll: { id: "new-poll-id", question: "Q?", options: [] } }), { status: 201 }),
    );

    render(<CreatePollForm />);
    await userEvent.type(screen.getByLabelText("Question"), "Best editor?");
    await userEvent.type(screen.getByLabelText("Option 1"), "Vim");
    await userEvent.type(screen.getByLabelText("Option 2"), "Emacs");
    await userEvent.click(screen.getByRole("button", { name: "Create poll" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/polls",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ question: "Best editor?", options: ["Vim", "Emacs"] }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/polls/new-poll-id");
  });

  it("shows the server's error message on a 400 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "A poll needs a question." }), { status: 400 }));

    render(<CreatePollForm />);
    await userEvent.type(screen.getByLabelText("Option 1"), "Vim");
    await userEvent.type(screen.getByLabelText("Option 2"), "Emacs");
    await userEvent.click(screen.getByRole("button", { name: "Create poll" }));

    expect(await screen.findByText("A poll needs a question.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
