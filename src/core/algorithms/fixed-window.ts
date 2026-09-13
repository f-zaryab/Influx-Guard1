import type { Store } from "../../stores/store";
import type { FixedWindowOptions, RateLimitDecision } from "../types";
import type { RateLimitAlgorithm } from "./algo";

type FixedWindowState = {
  count: number;
  resetTime: number;
};

export class FixedWindowAlgorithm implements RateLimitAlgorithm {
  constructor(
    private readonly store: Store,
    private readonly options: FixedWindowOptions,
  ) {}

  async consume(key: string): Promise<RateLimitDecision> {
    const now = Date.now();

    const storeKey = `fixed:${key}`;

    let state = await this.store.get<FixedWindowState>(storeKey);

    if (!state || now >= state.resetTime) {
      state = {
        count: 0,
        resetTime: now + this.options.windowMs,
      };
    }

    state.count += 1;

    const ttl = state.resetTime - now;

    await this.store.set(storeKey, state, ttl);

    return {
      allowed: state.count <= this.options.limit,
      limit: this.options.limit,
      remaining: Math.max(this.options.limit - state.count, 0),
      resetTime: new Date(state.resetTime),
    };
  }
}
