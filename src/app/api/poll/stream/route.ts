import { POLL_ID } from "@/lib/poll/definition";
import { getPollStore } from "@/lib/poll/store";
import type { TallySnapshot, Unsubscribe } from "@/lib/poll/types";

export async function GET(req: Request): Promise<Response> {
  const store = getPollStore();
  const encoder = new TextEncoder();
  let unsubscribe: Unsubscribe | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (snapshot: TallySnapshot) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      };

      send(await store.getTally(POLL_ID));
      unsubscribe = store.subscribe(POLL_ID, send);
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
