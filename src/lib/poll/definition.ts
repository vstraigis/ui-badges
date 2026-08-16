import type { Poll } from "./types";

export const POLL_ID = "favorite-language";

export const POLL: Poll = {
  id: POLL_ID,
  question: "What's your favorite language to build backends with?",
  options: [
    { id: "typescript", label: "TypeScript" },
    { id: "go", label: "Go" },
    { id: "python", label: "Python" },
    { id: "rust", label: "Rust" },
  ],
};
