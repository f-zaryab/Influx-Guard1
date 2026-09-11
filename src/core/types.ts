export type RateLimitResult = {
  totalHits: number;
  resetTime: Date;
};

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
};
