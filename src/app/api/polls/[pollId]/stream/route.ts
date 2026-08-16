import { getPollStore } from "@/lib/poll/store";
import type { TallySnapshot, Unsubscribe } from "@/lib/poll/types";

export async function GET(req: Request, ctx: RouteContext<"/api/polls/[pollId]/stream">): Promise<Response> {
  const { pollId } = await ctx.params;
  const store = getPollStore();

  const poll = await store.getPoll(pollId);
  if (!poll) {
    return Response.json({ error: "Poll not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: Unsubscribe | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (snapshot: TallySnapshot) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      };

      send(await store.getTally(pollId));
      unsubscribe = store.subscribe(pollId, send);
    },
    cancel() {
      unsubscribe?.();
    },
  });

  req.signal.addEventListener("abort", () => unsubscribe?.());

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
