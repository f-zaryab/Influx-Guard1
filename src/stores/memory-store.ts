import { RateLimitResult } from "../cores/types";
import { Store } from "./store";

type MemoryEntry = {
  count: number;
  resetTime: number;
};

export class MemoryStore implements Store {
  private readonly entries = new Map<string, MemoryEntry>();

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();

    const existingEntry = this.entries.get(key);

    // If no entry or time expired
    if (!existingEntry || now >= existingEntry.resetTime) {
      const resetTime = now + windowMs;

      this.entries.set(key, {
        count: 1,
        resetTime: resetTime,
      });

      return {
        totalHits: 1,
        resetTime: new Date(resetTime),
      };
    }

    // Else
    existingEntry.count += 1;

    return {
      totalHits: existingEntry.count,
      resetTime: new Date(existingEntry.resetTime),
    };
  }
}
