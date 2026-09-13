export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
};

// ============================================//
export type FixedWindowOptions = {
  limit: number;
  windowMs: number;
};

export type SlidingWindowOptions = {
  limit: number;
  windowMs: number;
};

export type TokenBucketOptions = {
  capacity: number;
  refillRate: number;
  refillIntervalMs: number;
};
