import Link from "next/link";
import { notFound } from "next/navigation";
import { PollResults } from "@/components/poll/PollResults";
import { VoteIsland } from "@/components/poll/VoteIsland";
import { getPollStore } from "@/lib/poll/store";

export const dynamic = "force-dynamic";

export default async function PollPage(props: PageProps<"/polls/[pollId]">) {
  const { pollId } = await props.params;
  const store = getPollStore();

  const poll = await store.getPoll(pollId);
  if (!poll) {
    notFound();
  }

  const snapshot = await store.getTally(pollId);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to all polls
        </Link>
        <PollResults poll={poll} />
        <VoteIsland
          poll={poll}
          initialTally={snapshot.tally}
          initialTotalVotes={snapshot.totalVotes}
          streamUrl={`/api/polls/${pollId}/stream`}
          voteUrl={`/api/polls/${pollId}/vote`}
          alreadyVoted={false}
        />
      </main>
    </div>
  );
}
