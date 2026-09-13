import type { Request } from "express";
import type { Store } from "../../stores/store";

export type NestRateLimiterOptions = {
  limit: number;
  windowMs: number;
  algorithm?: "fixed-window" | "sliding-window";
  store?: Store;
  keyGenerator?: (req: Request) => string;
  message?: string;
};
