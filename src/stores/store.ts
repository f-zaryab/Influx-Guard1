import type { RateLimitResult } from "../core/types";

export interface Store {
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
}
