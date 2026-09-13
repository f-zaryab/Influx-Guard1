import type { RateLimitAlgorithm } from "./algorithms/algo";
import type { RateLimitDecision } from "./types";

export class RateLimiter {
  constructor(private readonly algorithm: RateLimitAlgorithm) {}

  consume(key: string): Promise<RateLimitDecision> {
    return this.algorithm.consume(key);
  }
}
