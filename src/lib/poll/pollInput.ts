import { InvalidPollError } from "./errors";
import type { Poll, PollOption } from "./types";

const MAX_QUESTION_LENGTH = 200;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export interface CreatePollInput {
  question: string;
  options: string[];
}

function slugify(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `option-${index + 1}`;
}

function buildOptions(labels: string[]): PollOption[] {
  const used = new Set<string>();

  return labels.map((label, index) => {
    const base = slugify(label, index);
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(id);
    return { id, label };
  });
}

export function buildPollFromInput(input: CreatePollInput): Poll {
  const question = input.question.trim();
  if (!question) {
    throw new InvalidPollError("A poll needs a question.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new InvalidPollError(`Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
  }

  const labels = input.options.map((option) => option.trim()).filter((option) => option.length > 0);
  if (labels.length < MIN_OPTIONS) {
    throw new InvalidPollError(`A poll needs at least ${MIN_OPTIONS} options.`);
  }
  if (labels.length > MAX_OPTIONS) {
    throw new InvalidPollError(`A poll can have at most ${MAX_OPTIONS} options.`);
  }

  return {
    id: crypto.randomUUID(),
    question,
    options: buildOptions(labels),
  };
}
