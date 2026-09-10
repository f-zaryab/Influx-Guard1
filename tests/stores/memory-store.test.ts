import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../../src";

describe("Memory-Store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* 
  same key
    request 1 → 1
    request 2 → 2
  */
  it("increments requests for the same key", async () => {
    const store = new MemoryStore();

    const firstRequest = await store.increment("user-1", 60_000);
    const secondRequest = await store.increment("user-1", 60_000);

    expect(firstRequest.totalHits).toBe(1);
    expect(secondRequest.totalHits).toBe(2);
  });

  /* 
  different keys
    user-1 → 1
    user-2 → 1
  */
  it("keeps counters seperate between keys", async () => {
    const store = new MemoryStore();

    await store.increment("user-1", 60_000);

    const result = await store.increment("user-2", 60_000);

    expect(result.totalHits).toBe(1);
  });

  /* 
  window expires
    next request → count resets to 1
  */
  it("resets the counter after the window expires", async () => {
    const store = new MemoryStore();

    await store.increment("user-1", 60_000);
    await store.increment("user-1", 60_000);

    vi.advanceTimersByTime(60_000);

    const result = await store.increment("user-1", 60_000);

    expect(result.totalHits).toBe(1);
  });

  /*
  same window
    resetTime remains unchanged
  */
  it("sets reset time based on windowMs", async () => {
    const store = new MemoryStore();

    const result = await store.increment("user-1", 60_000);

    expect(result.resetTime.getTime()).toBe(Date.now() + 60_000);
  });
});
