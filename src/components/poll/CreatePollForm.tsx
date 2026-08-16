"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    setOptions((prev) => (prev.length >= MAX_OPTIONS ? prev : [...prev, ""]));
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length <= MIN_OPTIONS ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, options }),
      });

      if (res.status === 201) {
        const { poll } = await res.json();
        router.push(`/polls/${poll.id}`);
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span>Question</span>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span>{`Option ${index + 1}`}</span>
              <input
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <button
              type="button"
              onClick={() => removeOption(index)}
              disabled={options.length <= MIN_OPTIONS}
              className="px-2 py-2 text-sm text-zinc-500 disabled:opacity-40"
            >
              Remove option
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        disabled={options.length >= MAX_OPTIONS}
        className="self-start text-sm text-blue-600 disabled:opacity-40"
      >
        Add option
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        Create poll
      </button>
    </form>
  );
}
