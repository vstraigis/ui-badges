"use client";

import { useState, useSyncExternalStore } from "react";
import { useLivePoll } from "use-live-poll";
import type { Poll, Tally } from "@/lib/poll/types";
import { OfflineNotice } from "./OfflineNotice";
import { ResultsBars } from "./ResultsBars";
import { VoteButtons } from "./VoteButtons";

function hasVotedKey(pollId: string) {
  return `live-poll:has-voted:${pollId}`;
}

function subscribeHasVoted() {
  return () => {};
}

function getServerHasVoted() {
  return false;
}

interface VoteIslandProps {
  poll: Poll;
  initialTally: Tally;
  initialTotalVotes: number;
  streamUrl: string;
  voteUrl: string;
  alreadyVoted: boolean;
}

export function VoteIsland({
  poll,
  initialTally,
  initialTotalVotes,
  streamUrl,
  voteUrl,
  alreadyVoted,
}: VoteIslandProps) {
  const [votedThisSession, setVotedThisSession] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const storedHasVoted = useSyncExternalStore(
    subscribeHasVoted,
    () => window.localStorage.getItem(hasVotedKey(poll.id)) === "true",
    getServerHasVoted,
  );
  const hasVoted = alreadyVoted || votedThisSession || storedHasVoted;

  const { data, connected } = useLivePoll<Tally>(streamUrl, {
    initialData: { tally: initialTally, totalVotes: initialTotalVotes },
  });

  async function handleVote(optionId: string) {
    setPending(true);
    setError(undefined);

    try {
      const res = await fetch(voteUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      if (res.status === 200 || res.status === 409) {
        setVotedThisSession(true);
        window.localStorage.setItem(hasVotedKey(poll.id), "true");
        return;
      }

      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const tally = data?.tally ?? initialTally;
  const totalVotes = data?.totalVotes ?? initialTotalVotes;

  return (
    <div className="flex flex-col gap-4">
      <OfflineNotice connected={connected} />
      <ResultsBars options={poll.options} tally={tally} totalVotes={totalVotes} />
      <p className="text-sm text-zinc-500">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"} so far
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hasVoted ? (
        <p className="text-sm font-medium">Thanks for voting!</p>
      ) : (
        <VoteButtons options={poll.options} disabled={pending} onVote={handleVote} />
      )}
    </div>
  );
}
