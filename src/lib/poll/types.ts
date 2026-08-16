export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export type Tally = Record<string, number>;

export interface TallySnapshot {
  pollId: string;
  tally: Tally;
  totalVotes: number;
}

export type TallyListener = (snapshot: TallySnapshot) => void;

export type Unsubscribe = () => void;
