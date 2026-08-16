import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLivePoll } from "./useLivePoll";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  emitError() {
    this.onerror?.();
  }
}

beforeEach(() => {
  FakeEventSource.instances = [];
  // @ts-expect-error - test double, not a full EventSource implementation
  globalThis.EventSource = FakeEventSource;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLivePoll", () => {
  it("returns initialData before any message arrives", () => {
    const initialData = { tally: { a: 1, b: 2 }, totalVotes: 3 };
    const { result } = renderHook(() => useLivePoll("/stream", { initialData }));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.connected).toBe(false);
  });

  it("updates data when the EventSource receives a message", async () => {
    const { result } = renderHook(() => useLivePoll("/stream"));
    const source = FakeEventSource.instances[0];

    const snapshot = { tally: { a: 5 }, totalVotes: 5 };
    source.emitMessage(snapshot);

    await waitFor(() => expect(result.current.data).toEqual(snapshot));
  });

  it("toggles connected true on open and false on error", async () => {
    const { result } = renderHook(() => useLivePoll("/stream"));
    const source = FakeEventSource.instances[0];

    source.emitOpen();
    await waitFor(() => expect(result.current.connected).toBe(true));

    source.emitError();
    await waitFor(() => expect(result.current.connected).toBe(false));
  });

  it("closes the EventSource on unmount", () => {
    const { unmount } = renderHook(() => useLivePoll("/stream"));
    const source = FakeEventSource.instances[0];

    expect(source.closed).toBe(false);
    unmount();
    expect(source.closed).toBe(true);
  });
});
