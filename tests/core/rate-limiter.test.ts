import { describe, expect, it } from "vitest";
import { FixedWindowAlgorithm, MemoryStore, RateLimiter, SlidingWindowAlgorithm } from "../../src";

describe("Rate-Limiter", () => {
  it("delegates rate limiting to the fixed-window algorithm", async () => {
    const store = new MemoryStore();
    const algorithm = new FixedWindowAlgorithm(store, {
      limit: 3,
      windowMs: 60_000,
    });

    const limiter = new RateLimiter(algorithm);

    const result = await limiter.consume("user-1");

    expect(result).toMatchObject({
      allowed: true,
      limit: 3,
      remaining: 2,
    });

    expect(result.resetTime).toBeInstanceOf(Date);
  });

  it("delegates rate limiting to the sliding-window algorithm", async () => {
    const store = new MemoryStore();

    const algorithm = new SlidingWindowAlgorithm(store, {
      limit: 3,
      windowMs: 60_000,
    });

    const limiter = new RateLimiter(algorithm);

    const result = await limiter.consume("user-1");

    expect(result).toMatchObject({
      allowed: true,
      limit: 3,
      remaining: 2,
    });

    expect(result.resetTime).toBeInstanceOf(Date);
  });
});
