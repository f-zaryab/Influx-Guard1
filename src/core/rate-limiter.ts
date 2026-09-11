import type { Store } from "../stores/store";
import type { RateLimitDecision, RateLimiterOptions } from "./types";

export class RateLimiter {
  constructor(
    private readonly store: Store,
    private readonly options: RateLimiterOptions,
  ) {}

  async consume(key: string): Promise<RateLimitDecision> {
    const result = await this.store.increment(key, this.options.windowMs);

    const remaining = Math.max(this.options.limit - result.totalHits, 0);

    return {
      allowed: result.totalHits <= this.options.limit,
      limit: this.options.limit,
      remaining: remaining,
      resetTime: result.resetTime,
    };
  }
}
