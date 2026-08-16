import { useEffect, useRef, useState } from "react";

export interface LivePollSnapshot<TTally = Record<string, number>> {
  tally: TTally;
  totalVotes: number;
}

export interface UseLivePollOptions<TTally> {
  initialData?: LivePollSnapshot<TTally>;
  parse?: (raw: string) => LivePollSnapshot<TTally>;
}

export interface UseLivePollResult<TTally> {
  data: LivePollSnapshot<TTally> | undefined;
  connected: boolean;
  error: Error | undefined;
}

const defaultParse = <TTally>(raw: string): LivePollSnapshot<TTally> => JSON.parse(raw);

export function useLivePoll<TTally = Record<string, number>>(
  url: string,
  options?: UseLivePollOptions<TTally>,
): UseLivePollResult<TTally> {
  const [data, setData] = useState<LivePollSnapshot<TTally> | undefined>(options?.initialData);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const parse = options?.parse ?? defaultParse<TTally>;
  const parseRef = useRef(parse);

  useEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  useEffect(() => {
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      try {
        setData(parseRef.current(event.data));
        setError(undefined);
      } catch (cause) {
        setError(cause instanceof Error ? cause : new Error("Failed to parse live poll message"));
      }
    };

    source.onerror = () => setConnected(false);

    return () => {
      source.close();
    };
  }, [url]);

  return { data, connected, error };
}
