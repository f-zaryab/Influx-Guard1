import type { RateLimitDecision } from "../types";

export interface RateLimitAlgorithm {
  consume(key: string): Promise<RateLimitDecision>;
}
