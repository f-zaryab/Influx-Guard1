import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FixedWindowAlgorithm, MemoryStore } from "../../../src";

describe("FixedWindowAlgorithm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests below the limit", async () => {
    const store = new MemoryStore();
    const algorithm = new FixedWindowAlgorithm(store, {
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
    const algorithm = new FixedWindowAlgorithm(store, {
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
    const algorithm = new FixedWindowAlgorithm(store, {
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
    const algorithm = new FixedWindowAlgorithm(store, {
      limit: 1,
      windowMs: 60_000,
    });

    await algorithm.consume("user-1");
    const result = await algorithm.consume("user-2");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("resets the limit when the fixed window expires", async () => {
    const store = new MemoryStore();
    const algorithm = new FixedWindowAlgorithm(store, {
      limit: 2,
      windowMs: 60_000,
    });

    await algorithm.consume("user-1");
    await algorithm.consume("user-1");

    const blocked = await algorithm.consume("user-1");

    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(60_000);

    const result = await algorithm.consume("user-1");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("keeps the same reset time during the same window", async () => {
    const store = new MemoryStore();
    const algorithm = new FixedWindowAlgorithm(store, {
      limit: 3,
      windowMs: 60_000,
    });

    const first = await algorithm.consume("user-1");

    vi.advanceTimersByTime(10_000);

    const second = await algorithm.consume("user-1");

    expect(second.resetTime.getTime()).toBe(first.resetTime.getTime());
  });
});
