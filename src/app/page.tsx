import Link from "next/link";
import { PollList } from "@/components/poll/PollList";
import { getPollStore } from "@/lib/poll/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const polls = await getPollStore().listPolls();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Polls</h1>
          <Link href="/new" className="text-sm font-medium text-blue-600 hover:underline">
            Create a poll
          </Link>
        </div>
        <PollList polls={polls} />
      </main>
    </div>
  );
}
