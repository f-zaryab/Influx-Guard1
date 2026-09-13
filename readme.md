# InfluxGuard

A lightweight and extensible rate limiter for Node.js applications with first-class support for **Express** and **NestJS**.

InfluxGuard helps protect APIs from excessive requests using configurable rate-limiting algorithms, request limits, time windows, and client identification strategies.

## Features

- Lightweight API
- TypeScript support
- Express middleware integration
- NestJS guard integration
- Fixed Window rate limiting
- Sliding Window rate limiting
- Configurable request limits
- Configurable time windows
- Custom request key generators
- Custom rate-limit error messages
- Framework-independent rate-limiting core
- Extensible algorithm architecture
- In-memory storage
- Rate-limit response headers
- `Retry-After` header for blocked requests
- HTTP `429 Too Many Requests` responses

---

# Rate-Limiting Algorithms

InfluxGuard currently supports two rate-limiting algorithms:

- Fixed Window
- Sliding Window

The algorithm can be selected using the `algorithm` option.

```ts
{
  limit: 100,
  windowMs: 60_000,
  algorithm: "fixed-window",
}
```

or:

```ts
{
  limit: 100,
  windowMs: 60_000,
  algorithm: "sliding-window",
}
```

If `algorithm` is not provided, InfluxGuard uses:

```ts
algorithm: "fixed-window";
```

## Fixed Window

Fixed Window divides time into fixed intervals and counts requests within the active interval.

For example:

```ts
{
  limit: 100,
  windowMs: 60_000,
  algorithm: "fixed-window",
}
```

allows up to 100 requests during each 60-second window.

Conceptually:

```text
Window 1                 Window 2

0s ---------------- 60s ---------------- 120s
       requests              requests
```

When a new window begins, the counter starts again.

Fixed Window is simple and efficient, making it suitable for many general API rate-limiting scenarios.

## Sliding Window

Sliding Window provides smoother rate limiting around fixed-window boundaries.

Example:

```ts
{
  limit: 100,
  windowMs: 60_000,
  algorithm: "sliding-window",
}
```

InfluxGuard uses a weighted sliding-window counter that considers activity from the previous window together with activity in the current window.

Conceptually:

```text
Previous Window          Current Window
       │                       │
       └──── weighted ─────────┤
                               ↓
                    estimated request count
```

As the current window progresses, the influence of requests from the previous window gradually decreases.

This helps reduce bursts that can occur around fixed-window boundaries without requiring every individual request timestamp to be stored.

---

# Express Algorithm Selection

Fixed Window:

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

app.use(
  expressRateLimiter({
    limit: 100,
    windowMs: 60_000,
    algorithm: "fixed-window",
  }),
);
```

Sliding Window:

```ts
app.use(
  expressRateLimiter({
    limit: 100,
    windowMs: 60_000,
    algorithm: "sliding-window",
  }),
);
```

If `algorithm` is omitted, `fixed-window` is used by default.

---

# NestJS Algorithm Selection

Fixed Window:

```ts
import { createNestRateLimiterGuard } from "influxguard";

const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
  algorithm: "fixed-window",
});
```

Sliding Window:

```ts
const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
  algorithm: "sliding-window",
});
```

The resulting guard can then be applied normally:

```ts
@UseGuards(RateLimitGuard)
```

If `algorithm` is omitted, `fixed-window` is used by default.

---

# Configuration

Both Express and NestJS integrations share the same core rate-limiting configuration.

```ts
{
  limit: 100,
  windowMs: 60_000,
  algorithm: "fixed-window",
}
```

Available algorithms:

```ts
algorithm: "fixed-window";
```

or:

```ts
algorithm: "sliding-window";
```

Additional framework-specific options include custom key generators and error messages.

## `limit`

Maximum number of requests allowed by the configured rate-limiting algorithm.

```ts
{
  limit: 100,
}
```

## `windowMs`

Length of the rate-limit window in milliseconds.

```ts
{
  windowMs: 60_000,
}
```

Common values:

| Duration   |       Value |
| ---------- | ----------: |
| 1 second   |     `1_000` |
| 10 seconds |    `10_000` |
| 1 minute   |    `60_000` |
| 5 minutes  |   `300_000` |
| 15 minutes |   `900_000` |
| 1 hour     | `3_600_000` |

## `algorithm`

Controls which rate-limiting strategy is used.

```ts
{
  algorithm: "fixed-window",
}
```

Supported values:

```text
fixed-window
sliding-window
```

The default is:

```text
fixed-window
```

Use Fixed Window when you want a simple and efficient request counter.

Use Sliding Window when you want smoother rate limiting across window boundaries.

---

# Storage

InfluxGuard currently uses an **in-memory store** by default.

Rate-limit state is therefore stored inside the Node.js process running your application.

This works well for:

- development
- testing
- single-process applications
- simple deployments

For applications running multiple Node.js instances, containers, cluster workers, or servers, each process maintains its own independent in-memory rate-limit state.

```text
Node Instance A
      │
MemoryStore A

Node Instance B
      │
MemoryStore B
```

Requests handled by different instances therefore do not share the same rate-limit state when using `MemoryStore`.

A shared external store such as Redis is planned for distributed rate limiting across multiple application instances.

---

# TypeScript

InfluxGuard is written in TypeScript and ships with type declarations.

No separate `@types/influxguard` package is required.

Both ESM and CommonJS builds are provided.

ESM:

```ts
import { expressRateLimiter } from "influxguard";
```

CommonJS:

```js
const { expressRateLimiter } = require("influxguard");
```

---

# Package

Install the latest release:

```bash
npm install influxguard
```

Package name:

```text
influxguard
```

Current algorithm support:

```text
Fixed Window
Sliding Window
```

# License

MIT
