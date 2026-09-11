import { describe, expect, it } from "vitest";
import { MemoryStore, RateLimiter } from "../../src";

describe("Rate-Limiter", () => {
  it("allows request below the limit", async () => {
    const limiter = new RateLimiter(new MemoryStore(), {
      limit: 3,
      windowMs: 60_000,
    });

    const result = await limiter.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it("allows the request at exactly the limit", async () => {
    const limiter = new RateLimiter(new MemoryStore(), {
      limit: 2,
      windowMs: 60_000,
    });

    await limiter.consume("user-1");

    const result = await limiter.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks request above the limit", async () => {
    const limiter = new RateLimiter(new MemoryStore(), {
      limit: 2,
      windowMs: 60_000,
    });

    await limiter.consume("user-1");
    await limiter.consume("user-1");

    const result = await limiter.consume("user-1");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys idependently", async () => {
    const limiter = new RateLimiter(new MemoryStore(), {
      limit: 1,
      windowMs: 60_000,
    });

    await limiter.consume("user-1");

    const result = await limiter.consume("user-2");

    expect(result.allowed).toBe(true);
  });
});
