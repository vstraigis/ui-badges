import type { PollOption, Tally } from "@/lib/poll/types";

interface ResultsBarsProps {
  options: PollOption[];
  tally: Tally;
  totalVotes: number;
}

export function ResultsBars({ options, tally, totalVotes }: ResultsBarsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => {
        const count = tally[option.id] ?? 0;
        const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

        return (
          <li key={option.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{option.label}</span>
              <span className="text-zinc-500">
                {count} {count === 1 ? "vote" : "votes"}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${option.label}: ${percent}%`}
              className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
