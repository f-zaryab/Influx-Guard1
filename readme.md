# InfluxGuard

A lightweight and extensible rate limiter for Node.js applications with first-class support for **Express** and **NestJS**.

InfluxGuard helps protect APIs from excessive requests by limiting how many requests a client can make within a configured time window.

## Features

- Lightweight API
- TypeScript support
- Express middleware integration
- NestJS guard integration
- Configurable request limits
- Configurable time windows
- Custom request key generators
- Custom rate-limit error messages
- Framework-independent rate-limiting core
- In-memory storage
- Rate-limit response headers
- `Retry-After` header for blocked requests
- HTTP `429 Too Many Requests` responses

---

## Installation

Using npm:

```bash
npm install influxguard
```

Using pnpm:

```bash
pnpm add influxguard
```

Using Yarn:

```bash
yarn add influxguard
```

---

# Express

InfluxGuard exposes the `expressRateLimiter()` middleware for Express applications.

```ts
import { expressRateLimiter } from "influxguard";
```

## Basic usage

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

app.use(
  expressRateLimiter({
    limit: 100,
    windowMs: 60_000,
  }),
);

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from Express",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

This configuration allows a client to make:

```text
100 requests every 60 seconds
```

After the limit is exceeded, further requests are rejected with HTTP status `429` until the current rate-limit window expires.

---

## Protect a group of routes

Express allows middleware to be mounted on a particular path.

For example, to protect everything under `/api`:

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

app.use(
  "/api",
  expressRateLimiter({
    limit: 5,
    windowMs: 60_000,
  }),
);

app.get("/api", (_req, res) => {
  res.json({
    message: "Hello from Express",
  });
});

app.get("/public", (_req, res) => {
  res.json({
    message: "This route is not rate limited",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

In this example:

```text
/api     → rate limited
/public  → not rate limited
```

---

## Protect a single route

The limiter can also be passed directly to an Express route.

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

const loginLimiter = expressRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

app.post("/login", loginLimiter, (_req, res) => {
  res.json({
    message: "Login request accepted",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.listen(3000);
```

This is useful when only particular endpoints require protection.

---

## Different limits for different routes

You can create multiple rate limiters with different configurations.

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

const apiLimiter = expressRateLimiter({
  limit: 100,
  windowMs: 60_000,
});

const loginLimiter = expressRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

app.use("/api", apiLimiter);

app.post("/login", loginLimiter, (_req, res) => {
  res.json({
    message: "Login request accepted",
  });
});

app.get("/api/users", (_req, res) => {
  res.json({
    users: [],
  });
});

app.listen(3000);
```

For example:

```text
/api/*   → 100 requests per minute
/login   → 5 requests per minute
```

Stricter limits are often useful for endpoints such as:

- login
- registration
- password reset
- OTP verification
- expensive API operations

---

# Express custom key generator

By default, a rate limiter needs a key to identify which client owns a particular rate-limit bucket.

InfluxGuard supports a custom `keyGenerator` when you want to determine that key yourself.

For example, you can rate limit clients using an API key:

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

app.use(
  expressRateLimiter({
    limit: 10,
    windowMs: 60_000,

    keyGenerator: (req) => req.headers["x-api-key"]?.toString() ?? "anonymous",
  }),
);

app.get("/", (_req, res) => {
  res.json({
    message: "Hello",
  });
});

app.listen(3000);
```

Requests with different keys receive independent rate-limit buckets.

For example:

```text
x-api-key: user-a
```

and:

```text
x-api-key: user-b
```

are tracked independently.

If the limit is `1`:

```text
user-a → request 1 → allowed
user-a → request 2 → blocked

user-b → request 1 → allowed
```

A custom key generator can also be useful for rate limiting by:

- authenticated user ID
- API key
- tenant ID
- customer ID
- session ID
- another application-specific identifier

---

# Express response headers

InfluxGuard adds rate-limit information to the response headers.

For example:

```http
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: ...
```

### `RateLimit-Limit`

The maximum number of requests allowed during the current window.

### `RateLimit-Remaining`

The number of requests remaining in the current window.

For a limit of `2`:

```text
Request 1 → RateLimit-Remaining: 1
Request 2 → RateLimit-Remaining: 0
```

### `RateLimit-Reset`

Indicates when the current rate-limit window resets.

---

## Blocked Express requests

When the configured limit is exceeded, InfluxGuard returns:

```http
HTTP/1.1 429 Too Many Requests
```

with a response similar to:

```json
{
  "message": "Too many requests"
}
```

The response also includes:

```http
RateLimit-Limit: 5
RateLimit-Remaining: 0
Retry-After: ...
```

The `Retry-After` header tells the client approximately how long it should wait before trying again.

---

# NestJS

InfluxGuard exposes `createNestRateLimiterGuard()` for NestJS applications.

```ts
import { createNestRateLimiterGuard } from "influxguard";
```

The function creates a NestJS guard class configured with your rate-limit settings.

---

## Basic NestJS usage

Create a guard:

```ts
import { createNestRateLimiterGuard } from "influxguard";

const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
});
```

Then apply it using NestJS's `@UseGuards()` decorator.

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { createNestRateLimiterGuard } from "influxguard";

const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
});

@Controller("users")
export class UsersController {
  @Get()
  @UseGuards(RateLimitGuard)
  findAll() {
    return {
      message: "Users endpoint",
    };
  }
}
```

The endpoint now allows:

```text
100 requests every 60 seconds
```

Further requests during the same window receive HTTP `429`.

---

# Protect an entire NestJS controller

The guard can be applied at controller level.

```ts
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { createNestRateLimiterGuard } from "influxguard";

const ProductsRateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
});

@Controller("products")
@UseGuards(ProductsRateLimitGuard)
export class ProductsController {
  @Get()
  findAll() {
    return {
      message: "All products",
    };
  }

  @Post()
  create() {
    return {
      message: "Product created",
    };
  }
}
```

All endpoints inside the controller are now protected by the same limiter.

---

# Route-specific NestJS limits

Different guards can be created for different endpoints.

```ts
import { Controller, Post, UseGuards } from "@nestjs/common";
import { createNestRateLimiterGuard } from "influxguard";

const LoginRateLimitGuard = createNestRateLimiterGuard({
  limit: 5,
  windowMs: 60_000,
});

const RegistrationRateLimitGuard = createNestRateLimiterGuard({
  limit: 3,
  windowMs: 60_000,
});

@Controller("auth")
export class AuthController {
  @Post("login")
  @UseGuards(LoginRateLimitGuard)
  login() {
    return {
      message: "Login request accepted",
    };
  }

  @Post("register")
  @UseGuards(RegistrationRateLimitGuard)
  register() {
    return {
      message: "Registration request accepted",
    };
  }
}
```

The resulting limits are:

```text
POST /auth/login
5 requests per minute

POST /auth/register
3 requests per minute
```

---

# NestJS custom key generator

NestJS guards also support custom request keys.

For example:

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { createNestRateLimiterGuard } from "influxguard";

const ApiKeyRateLimitGuard = createNestRateLimiterGuard({
  limit: 10,
  windowMs: 60_000,

  keyGenerator: (request) => request.headers["x-api-key"] as string,
});

@Controller("api")
@UseGuards(ApiKeyRateLimitGuard)
export class ApiController {
  @Get()
  index() {
    return {
      message: "Hello",
    };
  }
}
```

Different API keys are tracked independently.

For example:

```text
user-a → own rate-limit bucket
user-b → separate rate-limit bucket
```

---

# Custom error messages

NestJS rate limiters support a custom message for blocked requests.

```ts
import { createNestRateLimiterGuard } from "influxguard";

const RateLimitGuard = createNestRateLimiterGuard({
  limit: 5,
  windowMs: 60_000,
  message: "Slow down",
});
```

When the limit is exceeded, the response will contain:

```json
{
  "message": "Slow down"
}
```

instead of the default:

```json
{
  "message": "Too many requests"
}
```

---

# NestJS response headers

NestJS responses include the same rate-limit information.

For example:

```http
RateLimit-Limit: 2
RateLimit-Remaining: 1
RateLimit-Reset: ...
```

After another successful request:

```http
RateLimit-Limit: 2
RateLimit-Remaining: 0
RateLimit-Reset: ...
```

When another request exceeds the limit:

```http
HTTP/1.1 429 Too Many Requests

RateLimit-Limit: 2
RateLimit-Remaining: 0
Retry-After: ...
```

---

# Configuration

Both Express and NestJS integrations share the same core rate-limiting concepts.

A basic configuration looks like:

```ts
{
  limit: 100,
  windowMs: 60_000,
}
```

Additional supported options include:

```ts
{
  limit: 100,
  windowMs: 60_000,
  keyGenerator: (request) => "...",
  message: "Too many requests",
}
```

Support for individual options may depend on the framework adapter.

---

## `limit`

Maximum number of requests allowed during one rate-limit window.

```ts
{
  limit: 100,
}
```

For example:

```text
limit: 100
```

means that a client can make up to 100 requests during the active window.

The next request is blocked.

---

## `windowMs`

Length of the rate-limit window in milliseconds.

```ts
{
  windowMs: 60_000,
}
```

represents:

```text
60,000 milliseconds
= 60 seconds
= 1 minute
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

---

## `keyGenerator`

Controls how requests are grouped into rate-limit buckets.

Express example:

```ts
keyGenerator: (req) => req.headers["x-api-key"]?.toString() ?? "anonymous";
```

NestJS example:

```ts
keyGenerator: (request) => request.headers["x-api-key"] as string;
```

This lets applications rate limit using identifiers other than the default client identity.

---

## `message`

Customizes the error message returned when a request is blocked.

Example:

```ts
{
  limit: 5,
  windowMs: 60_000,
  message: "Slow down",
}
```

Blocked requests return:

```json
{
  "message": "Slow down"
}
```

---

# Rate-limit behavior

Consider:

```ts
{
  limit: 3,
  windowMs: 60_000,
}
```

The request sequence behaves like:

```text
Request 1 → allowed
Request 2 → allowed
Request 3 → allowed

Request 4 → 429 Too Many Requests
Request 5 → 429 Too Many Requests

            ↓

      window expires

            ↓

Request 1 → allowed again
```

The request counter resets when the current window expires.

---

# Rate-limit headers

InfluxGuard exposes information about the active rate limit using response headers.

```text
RateLimit-Limit
RateLimit-Remaining
RateLimit-Reset
```

Blocked requests additionally receive:

```text
Retry-After
```

For a limiter configured as:

```ts
{
  limit: 2,
  windowMs: 60_000,
}
```

the requests would approximately look like:

```text
Request 1
Status: 200
RateLimit-Limit: 2
RateLimit-Remaining: 1

Request 2
Status: 200
RateLimit-Limit: 2
RateLimit-Remaining: 0

Request 3
Status: 429
RateLimit-Limit: 2
RateLimit-Remaining: 0
Retry-After: ...
```

---

# HTTP 429 response

When the limit is exceeded, InfluxGuard responds with:

```http
HTTP/1.1 429 Too Many Requests
```

By default, the response body contains:

```json
{
  "message": "Too many requests"
}
```

The client should respect the `Retry-After` header before retrying the request.

---

# Express vs NestJS

InfluxGuard provides framework-specific adapters built on the same rate-limiting core.

### Express

```ts
import { expressRateLimiter } from "influxguard";
```

Usage:

```ts
app.use(
  expressRateLimiter({
    limit: 100,
    windowMs: 60_000,
  }),
);
```

### NestJS

```ts
import { createNestRateLimiterGuard } from "influxguard";
```

Usage:

```ts
const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
});
```

Then:

```ts
@UseGuards(RateLimitGuard)
```

Conceptually:

```text
                     InfluxGuard
                         │
                  Rate Limiting Core
                    /           \
                   /             \
                  ▼               ▼
          Express Adapter    NestJS Adapter
             Middleware          Guard
```

---

# Complete Express example

```ts
import express from "express";
import { expressRateLimiter } from "influxguard";

const app = express();

app.use(express.json());

app.use(
  "/api",
  expressRateLimiter({
    limit: 5,
    windowMs: 60_000,
  }),
);

app.get("/api", (_req, res) => {
  res.json({
    message: "InfluxGuard is protecting this API",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

Run the server and repeatedly call:

```bash
curl http://localhost:3000/api
```

The first five requests are allowed.

Further requests during the same window receive:

```http
429 Too Many Requests
```

---

# Complete NestJS example

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { createNestRateLimiterGuard } from "influxguard";

const AppRateLimitGuard = createNestRateLimiterGuard({
  limit: 10,
  windowMs: 60_000,
});

@Controller()
@UseGuards(AppRateLimitGuard)
export class AppController {
  @Get()
  getHello() {
    return {
      message: "InfluxGuard is protecting this endpoint",
    };
  }
}
```

The endpoint allows 10 requests during each 60-second window.

Requests after the limit receive:

```http
429 Too Many Requests
```

---

# TypeScript

InfluxGuard is written in TypeScript and ships with type declarations.

No separate `@types/influxguard` package is required.

Type inference works directly with the package API:

```ts
import { expressRateLimiter } from "influxguard";

const limiter = expressRateLimiter({
  limit: 100,
  windowMs: 60_000,

  keyGenerator: (req) => req.headers["x-api-key"]?.toString() ?? "anonymous",
});
```

NestJS usage is also fully typed:

```ts
import { createNestRateLimiterGuard } from "influxguard";

const RateLimitGuard = createNestRateLimiterGuard({
  limit: 100,
  windowMs: 60_000,
});
```

---

# ESM

InfluxGuard is distributed as an ES module.

Use standard ES module imports:

```ts
import { expressRateLimiter } from "influxguard";
```

or:

```ts
import { createNestRateLimiterGuard } from "influxguard";
```

---

# Recommended usage

General API endpoints:

```ts
{
  limit: 100,
  windowMs: 60_000,
}
```

Authentication endpoints:

```ts
{
  limit: 5,
  windowMs: 60_000,
}
```

Expensive operations:

```ts
{
  limit: 10,
  windowMs: 60_000,
}
```

These are only examples.

Choose limits appropriate for your application's expected traffic, infrastructure, and security requirements.

---

# Storage

InfluxGuard currently uses an **in-memory store**.

This means rate-limit state is stored inside the Node.js process running your application.

This works well for:

- development
- testing
- single-process applications
- simple deployments

For applications running multiple Node.js instances, containers, workers, or servers, each process currently maintains its own independent rate-limit state.

For example:

```text
Node Instance A
MemoryStore A

Node Instance B
MemoryStore B
```

Requests handled by different application instances therefore do not currently share the same counter.

A shared external store such as Redis can be used in future versions to support distributed rate limiting across multiple application instances.

---

# Package

Install from npm:

```bash
npm install influxguard
```

Package name:

```text
influxguard
```

---

# License

MIT
