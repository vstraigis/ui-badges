"use client";

import type { PollOption } from "@/lib/poll/types";

interface VoteButtonsProps {
  options: PollOption[];
  disabled: boolean;
  onVote: (optionId: string) => void;
}

export function VoteButtons({ options, disabled, onVote }: VoteButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onVote(option.id)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
