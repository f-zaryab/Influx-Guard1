import type { Store } from "../../stores/store";
import type { RateLimitDecision, SlidingWindowOptions } from "../types";
import type { RateLimitAlgorithm } from "./algo";

type SlidingWindowState = {
  previousCount: number;
  currentCount: number;
  currentWindowStart: number;
};

export class SlidingWindowAlgorithm implements RateLimitAlgorithm {
  constructor(
    private readonly store: Store,
    private readonly options: SlidingWindowOptions,
  ) {}

  async consume(key: string): Promise<RateLimitDecision> {
    const now = Date.now();
    const windowStart = Math.floor(now / this.options.windowMs) * this.options.windowMs;

    const storeKey = `sliding:${key}`;

    let state = await this.store.get<SlidingWindowState>(storeKey);

    if (!state) {
      state = {
        previousCount: 0,
        currentCount: 0,
        currentWindowStart: windowStart,
      };
    }

    const windowPassed = Math.floor(
      (windowStart - state.currentWindowStart) / this.options.windowMs,
    );

    if (windowPassed > 0) {
      state.previousCount = windowPassed === 1 ? state.currentCount : 0;

      state.currentCount = 0;
      state.currentWindowStart = windowStart;
    }

    const elapsed = now - state.currentWindowStart;
    const previousWeight = 1 - elapsed / this.options.windowMs;

    state.currentCount += 1;

    const estimatedCount = state.currentCount + state.previousCount * previousWeight;

    const allowed = estimatedCount <= this.options.limit;

    const remaining = Math.max(Math.floor(this.options.limit - estimatedCount), 0);

    const resetTime = state.currentWindowStart + this.options.windowMs;

    await this.store.set(storeKey, state, this.options.windowMs * 2);

    return {
      allowed: allowed,
      limit: this.options.limit,
      remaining: remaining,
      resetTime: new Date(resetTime),
    };
  }
}
