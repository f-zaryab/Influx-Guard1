import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore, SlidingWindowAlgorithm } from "../../../src";

describe("SlidingWindowAlgorithm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests below the limit", async () => {
    const store = new MemoryStore();
    const algorithm = new SlidingWindowAlgorithm(store, {
      limit: 3,
      windowMs: 60_0000,
    });

    const result = await algorithm.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it("allows a request exactly at the limit", async () => {
    const store = new MemoryStore();
    const algorithm = new SlidingWindowAlgorithm(store, {
      limit: 2,
      windowMs: 60_000,
    });

    await algorithm.consume("user-1");
    const result = await algorithm.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks requests above the limit", async () => {
    const store = new MemoryStore();
    const algorithm = new SlidingWindowAlgorithm(store, {
      limit: 2,
      windowMs: 60_000,
    });

    await algorithm.consume("user-1");
    await algorithm.consume("user-1");
    const result = await algorithm.consume("user-1");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    const store = new MemoryStore();
    const algorithm = new SlidingWindowAlgorithm(store, {
      limit: 1,
      windowMs: 60_000,
    });

    await algorithm.consume("user-1");
    const result = await algorithm.consume("user-2");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("reduces the weight of requests from the previous window over time", async () => {
    const algorithm = new SlidingWindowAlgorithm(new MemoryStore(), {
      limit: 2,
      windowMs: 60_000,
    });

    // t = 0
    await algorithm.consume("user-1");

    // t = 30
    vi.advanceTimersByTime(30_000);

    const second = await algorithm.consume("user-1");

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    // t = 90
    // We are halfway through the next window.
    vi.advanceTimersByTime(60_000);

    const result = await algorithm.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
