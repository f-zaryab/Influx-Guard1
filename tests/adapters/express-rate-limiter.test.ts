import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { expressRateLimiter } from "../../src";

describe("Express-Rate-Limiter", () => {
  it("allows requests within the limit", async () => {
    const app = express();

    app.use(
      expressRateLimiter({
        limit: 2,
        windowMs: 60_000,
      }),
    );

    app.use("/", (_req, res) => {
      res.status(200).json({
        message: "success",
      });
    });

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["ratelimit-limit"]).toBe("2");
    expect(response.headers["ratelimit-remaining"]).toBe("1");
  });

  it("returns 429 after exceeding the limit", async () => {
    const app = express();

    app.use(
      expressRateLimiter({
        limit: 1,
        windowMs: 60_000,
      }),
    );

    app.use("/", (_req, res) => {
      res.status(200).json({
        message: "success",
      });
    });

    await request(app).get("/");

    const response = await request(app).get("/");

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      message: "Too many requests",
    });
    expect(response.headers["ratelimit-limit"]).toBe("1");
    expect(response.headers["ratelimit-remaining"]).toBe("0");
    expect(response.headers["retry-after"]).toBeDefined();
  });

  it("supports a custom key generator", async () => {
    const app = express();

    app.use(
      expressRateLimiter({
        limit: 1,
        windowMs: 60_000,
        keyGenerator: (req) => req.headers["x-api-key"]?.toString() ?? "anonymous",
      }),
    );

    app.get("/", (_req, res) => {
      res.send(200);
    });

    await request(app).get("/").set("x-api-key", "user-a").expect(200);
    await request(app).get("/").set("x-api-key", "user-a").expect(429);
    await request(app).get("/").set("x-api-key", "user-b").expect(200);
  });
});
