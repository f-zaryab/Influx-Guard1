import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  mixin,
  type Type,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { RateLimiter } from "../../core/rate-limiter";
import { MemoryStore } from "../../stores/memory-store";
import type { NestRateLimiterOptions } from "./types";

export function createNestRateLimiterGuard(options: NestRateLimiterOptions): Type<CanActivate> {
  @Injectable()
  class RateLimiterGuard implements CanActivate {
    private readonly limiter = new RateLimiter(options.store ?? new MemoryStore(), {
      limit: options.limit,
      windowMs: options.windowMs,
    });

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();

      const key = options.keyGenerator?.(request) ?? request.ip ?? "unknown";

      const decision = await this.limiter.consume(key);

      response.setHeader("RateLimit-Limit", decision.limit.toString());
      response.setHeader("RateLimit-Remaining", decision.remaining.toString());
      response.setHeader("RateLimit-Reset", decision.resetTime.toISOString());

      if (!decision.allowed) {
        const retryAfter = Math.max(
          Math.ceil((decision.resetTime.getTime() - Date.now()) / 1000),
          0,
        );

        response.setHeader("Retry-After", retryAfter.toString());

        throw new HttpException(
          options.message ?? "Too many requests",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // If decision is allowed
      return true;
    }
  }

  return mixin(RateLimiterGuard);
}
