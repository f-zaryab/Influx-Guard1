import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../../src";

describe("MemoryStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves a value", async () => {
    const store = new MemoryStore();

    await store.set("user-1", { count: 1 }, 60_000);

    const result = await store.get<{ count: number }>("user-1");

    expect(result).toEqual({
      count: 1,
    });
  });

  it("returns undefined for a missing key", async () => {
    const store = new MemoryStore();

    const result = await store.get("user-1");

    expect(result).toBeUndefined();
  });

  it("keeps different keys independent", async () => {
    const store = new MemoryStore();

    await store.set("user-1", { count: 1 }, 60_000);
    await store.set("user-2", { count: 5 }, 60_000);

    const user1 = await store.get<{ count: number }>("user-1");
    const user2 = await store.get<{ count: number }>("user-2");

    expect(user1).toEqual({ count: 1 });
    expect(user2).toEqual({ count: 5 });
  });

  it("overwrites an existing value", async () => {
    const store = new MemoryStore();

    await store.set("user-1", { count: 1 }, 60_000);
    await store.set("user-1", { count: 2 }, 60_000);

    const result = await store.get<{ count: number }>("user-1");

    expect(result).toEqual({
      count: 2,
    });
  });

  it("expires a value after its TTL", async () => {
    const store = new MemoryStore();

    await store.set("user-1", { count: 1 }, 60_000);

    vi.advanceTimersByTime(60_000);

    const result = await store.get("user-1");

    expect(result).toBeUndefined();
  });

  it("keeps a value before its TTL expires", async () => {
    const store = new MemoryStore();

    await store.set("user-1", { count: 1 }, 60_000);

    vi.advanceTimersByTime(59_999);

    const result = await store.get<{ count: number }>("user-1");

    expect(result).toEqual({
      count: 1,
    });
  });
});
