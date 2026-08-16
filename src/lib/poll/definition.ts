import type { Poll } from "./types";

export const SEED_POLL_ID = "favorite-language";

export const SEED_POLL: Poll = {
  id: SEED_POLL_ID,
  question: "What's your favorite language to build backends with?",
  options: [
    { id: "typescript", label: "TypeScript" },
    { id: "go", label: "Go" },
    { id: "python", label: "Python" },
    { id: "rust", label: "Rust" },
  ],
};
