import { NextResponse } from "next/server";
import { getPollStore } from "@/lib/poll/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/polls/[pollId]">): Promise<NextResponse> {
  const { pollId } = await ctx.params;
  const store = getPollStore();

  const poll = await store.getPoll(pollId);
  if (!poll) {
    return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  }

  const snapshot = await store.getTally(pollId);
  return NextResponse.json({ poll, ...snapshot });
}
