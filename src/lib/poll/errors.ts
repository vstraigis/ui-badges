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
