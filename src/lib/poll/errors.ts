export class InvalidOptionError extends Error {
  constructor(optionId: string) {
    super(`"${optionId}" is not a valid option for this poll.`);
    this.name = "InvalidOptionError";
  }
}

export class DuplicateVoteError extends Error {
  constructor() {
    super("This voter has already voted in this poll.");
    this.name = "DuplicateVoteError";
  }
}

export class InvalidPollError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPollError";
  }
}

export class PollNotFoundError extends Error {
  constructor(pollId: string) {
    super(`No poll exists with id "${pollId}".`);
    this.name = "PollNotFoundError";
  }
}
