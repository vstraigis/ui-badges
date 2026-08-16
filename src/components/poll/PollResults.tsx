import type { Poll } from "@/lib/poll/types";

interface PollResultsProps {
  poll: Poll;
}

export function PollResults({ poll }: PollResultsProps) {
  return <h1 className="text-2xl font-semibold">{poll.question}</h1>;
}
