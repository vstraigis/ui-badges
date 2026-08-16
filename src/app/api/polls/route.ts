import { NextResponse, type NextRequest } from "next/server";
import { InvalidPollError } from "@/lib/poll/errors";
import { getPollStore } from "@/lib/poll/store";

export async function GET(): Promise<NextResponse> {
  const polls = await getPollStore().listPolls();
  return NextResponse.json({ polls });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { question?: string; options?: string[] };

  try {
    const poll = await getPollStore().createPoll({
      question: body.question ?? "",
      options: body.options ?? [],
    });
    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidPollError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
