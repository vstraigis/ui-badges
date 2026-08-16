import { NextResponse } from "next/server";
import { POLL, POLL_ID } from "@/lib/poll/definition";
import { getPollStore } from "@/lib/poll/store";

export async function GET(): Promise<NextResponse> {
  const store = getPollStore();
  const snapshot = await store.getTally(POLL_ID);

  return NextResponse.json({ poll: POLL, ...snapshot });
}
