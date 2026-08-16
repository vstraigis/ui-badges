import { NextResponse, type NextRequest } from "next/server";
import { DuplicateVoteError, InvalidOptionError, PollNotFoundError } from "@/lib/poll/errors";
import { getPollStore } from "@/lib/poll/store";
import { getOrCreateVoterId, VOTER_COOKIE_NAME } from "@/lib/poll/voterId";

const VOTER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/polls/[pollId]/vote">,
): Promise<NextResponse> {
  const { pollId } = await ctx.params;
  const { optionId } = (await req.json()) as { optionId?: string };
  const { id: voterId, isNew } = getOrCreateVoterId(req.cookies);

  try {
    const snapshot = await getPollStore().registerVote(pollId, optionId ?? "", voterId);
    const res = NextResponse.json(snapshot, { status: 200 });

    if (isNew) {
      res.cookies.set(VOTER_COOKIE_NAME, voterId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VOTER_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return res;
  } catch (error) {
    if (error instanceof PollNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidOptionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof DuplicateVoteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
