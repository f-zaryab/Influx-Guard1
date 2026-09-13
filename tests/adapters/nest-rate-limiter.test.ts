import { Controller, Get, type INestApplication, UseGuards } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createNestRateLimiterGuard } from "../../src";

const TestRateLimitGuard = createNestRateLimiterGuard({
  limit: 2,
  windowMs: 60_000,
  algorithm: "fixed-window",
});

@Controller()
@UseGuards(TestRateLimitGuard)
class TestController {
  @Get("/")
  index() {
    return {
      message: "Hello World",
    };
  }
}

describe("Nest rate limiter", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("allows requests within the limit", async () => {
    await request(app.getHttpServer()).get("/").expect(200);
    await request(app.getHttpServer()).get("/").expect(200);
  });

  it("blocks requests after the limit is exceeded", async () => {
    await request(app.getHttpServer()).get("/").expect(200);
    await request(app.getHttpServer()).get("/").expect(200);

    const response = await request(app.getHttpServer()).get("/").expect(429);
    expect(response.body.message).toBe("Too many requests");
  });

  it("adds rate limit headers", async () => {
    const response = await request(app.getHttpServer()).get("/").expect(200);

    expect(response.headers["ratelimit-limit"]).toBe("2");
    expect(response.headers["ratelimit-remaining"]).toBe("1");
    expect(response.headers["ratelimit-reset"]).toBeDefined();
  });

  it("decrements RateLimit-Remaining after each request", async () => {
    const firstResponse = await request(app.getHttpServer()).get("/").expect(200);
    expect(firstResponse.headers["ratelimit-remaining"]).toBe("1");

    const secondResponse = await request(app.getHttpServer()).get("/").expect(200);
    expect(secondResponse.headers["ratelimit-remaining"]).toBe("0");
  });

  it("adds Retry-After when the request is blocked", async () => {
    await request(app.getHttpServer()).get("/").expect(200);
    await request(app.getHttpServer()).get("/").expect(200);

    const response = await request(app.getHttpServer()).get("/").expect(429);

    expect(response.headers["retry-after"]).toBeDefined();

    const retryAfter = Number(response.headers["retry-after"]);

    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("uses a custom error message", async () => {
    const CustomGuard = createNestRateLimiterGuard({
      limit: 1,
      windowMs: 60_000,
      message: "Slow down",
    });

    @Controller("custom")
    @UseGuards(CustomGuard)
    class CustomController {
      @Get()
      index() {
        return "OK";
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [CustomController],
    }).compile();

    const customApp = moduleRef.createNestApplication();
    await customApp.init();

    await request(customApp.getHttpServer()).get("/custom").expect(200);

    const response = await request(customApp.getHttpServer()).get("/custom").expect(429);

    expect(response.body.message).toBe("Slow down");

    await customApp.close();
  });

  it("supports a custom key generator", async () => {
    const CustomKeyGuard = createNestRateLimiterGuard({
      limit: 1,
      windowMs: 60_000,
      keyGenerator: (request) => request.headers["x-api-key"] as string,
    });

    @Controller("api")
    @UseGuards(CustomKeyGuard)
    class ApiController {
      @Get()
      index() {
        return "OK";
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [ApiController],
    }).compile();

    const customApp = moduleRef.createNestApplication();
    await customApp.init();

    // User A consumes their limit.
    await request(customApp.getHttpServer()).get("/api").set("x-api-key", "user-a").expect(200);

    await request(customApp.getHttpServer()).get("/api").set("x-api-key", "user-a").expect(429);

    // User B has a separate bucket.
    await request(customApp.getHttpServer()).get("/api").set("x-api-key", "user-b").expect(200);

    await customApp.close();
  });

  it("supports sliding-window algorithm", async () => {
    const SlidingWindowGuard = createNestRateLimiterGuard({
      limit: 1,
      windowMs: 60_000,
      algorithm: "sliding-window",
    });

    @Controller("sliding")
    @UseGuards(SlidingWindowGuard)
    class SlidingController {
      @Get()
      index() {
        return {
          message: "OK",
        };
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [SlidingController],
    }).compile();

    const slidingApp = moduleRef.createNestApplication();

    await slidingApp.init();

    await request(slidingApp.getHttpServer()).get("/sliding").expect(200);

    await request(slidingApp.getHttpServer()).get("/sliding").expect(429);

    await slidingApp.close();
  });
});
