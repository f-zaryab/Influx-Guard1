import { describe, expect, it } from "vitest";
import { MemoryStore } from "../../src";

describe("Memory-Store", () => {
  it("increments requests for the same key", async () => {
    const store = new MemoryStore();

    const firstRequest = await store.increment("user-1", 60_000);
    const secondRequest = await store.increment("user-1", 60_000);

    expect(firstRequest.totalHits).toBe(1);
    expect(secondRequest.totalHits).toBe(2);
  });

  it("keeps counters seperate between keys", async () => {
    const store = new MemoryStore();

    await store.increment("user-1", 60_000);

    const result = await store.increment("user-2", 60_000);

    expect(result.totalHits).toBe(1);
  });
});
