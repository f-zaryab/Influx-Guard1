import type { NextFunction, Request, Response } from "express";
import type { RateLimitAlgorithm } from "../../core/algorithms/algo";
import { FixedWindowAlgorithm } from "../../core/algorithms/fixed-window";
import { SlidingWindowAlgorithm } from "../../core/algorithms/sliding-window";
import { RateLimiter } from "../../core/rate-limiter";
import { MemoryStore } from "../../stores/memory-store";
import type { ExpressRateLimiterOptions } from "./types";

export const expressRateLimiter = (options: ExpressRateLimiterOptions) => {
  const store = options.store ?? new MemoryStore();

  let algorithm: RateLimitAlgorithm;

  switch (options.algorithm) {
    case "sliding-window":
      algorithm = new SlidingWindowAlgorithm(store, {
        limit: options.limit,
        windowMs: options.windowMs,
      });
      break;

    case "fixed-window":
      algorithm = new FixedWindowAlgorithm(store, {
        limit: options.limit,
        windowMs: options.windowMs,
      });
      break;

    default:
      algorithm = new FixedWindowAlgorithm(store, {
        limit: options.limit,
        windowMs: options.windowMs,
      });
      break;
  }

  const limiter = new RateLimiter(algorithm);

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator?.(req) ?? req.ip ?? "unknown";

    const decision = await limiter.consume(key);

    res.setHeader("RateLimit-Limit", decision.limit.toString());
    res.setHeader("RateLimit-Remaining", decision.remaining.toString());
    res.setHeader("RateLimit-Reset", decision.resetTime.toISOString());

    // If allowed limits exceeds
    if (!decision.allowed) {
      const retryAfter = Math.max(Math.ceil((decision.resetTime.getTime() - Date.now()) / 1000), 0);

      res.setHeader("Retry-After", retryAfter.toString());

      return res.status(429).json({
        message: options.message ?? "Too many requests",
      });
    }

    // otherwise: continue
    next();
  };
};
