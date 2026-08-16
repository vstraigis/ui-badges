import { PollResults } from "@/components/poll/PollResults";
import { VoteIsland } from "@/components/poll/VoteIsland";
import { POLL, POLL_ID } from "@/lib/poll/definition";
import { getPollStore } from "@/lib/poll/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = getPollStore();
  const snapshot = await store.getTally(POLL_ID);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <PollResults poll={POLL} />
        <VoteIsland
          poll={POLL}
          initialTally={snapshot.tally}
          initialTotalVotes={snapshot.totalVotes}
          streamUrl="/api/poll/stream"
          voteUrl="/api/vote"
          alreadyVoted={false}
        />
      </main>
    </div>
  );
}
