import type { RateLimitResult } from "../cores/types";

export interface Store {
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
}
