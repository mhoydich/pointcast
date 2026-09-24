/** Thrown by an oracle spec when it cannot answer honestly right now. Nobody is charged. */
export class OracleUnavailable extends Error {
  constructor(message: string, readonly retryAfterSeconds = 60) { super(message); }
}
