import Link from "next/link";
import type { Poll } from "@/lib/poll/types";

interface PollListProps {
  polls: Poll[];
}

export function PollList({ polls }: PollListProps) {
  if (polls.length === 0) {
    return <p className="text-gray-500">No polls yet — be the first to create one.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {polls.map((poll) => (
        <li key={poll.id}>
          <Link href={`/polls/${poll.id}`} className="text-blue-600 hover:underline">
            {poll.question}
          </Link>
        </li>
      ))}
    </ul>
  );
}
