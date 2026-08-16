import { CreatePollForm } from "@/components/poll/CreatePollForm";

export default function NewPollPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Create a poll</h1>
        <CreatePollForm />
      </main>
    </div>
  );
}
