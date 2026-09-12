# InfluxGuard

A lightweight and extensible rate limiter for Node.js applications, with first-class support for **Express** and **NestJS**.

InfluxGuard helps protect your APIs from excessive requests by limiting how many requests a client can make within a configured time window.

## Features

- Lightweight and simple API
- TypeScript support
- Express middleware integration
- NestJS guard integration
- Configurable request limits
- Configurable time windows
- Framework-independent rate limiting core
- In-memory storage
- Rate limit response headers
- HTTP `429 Too Many Requests` responses when limits are exceeded

---

## Installation

Install InfluxGuard using npm:

```bash
npm install influxguard
```

Or with pnpm:

```bash
pnpm add influxguard
```

Or Yarn:

```bash
yarn add influxguard
```

---

# Express

InfluxGuard can be used as standard Express middleware.

## Basic usage

```ts
import express from "express";
import { InfluxGuardMiddleware } from "influxguard";

const app = express();

app.use(
  InfluxGuardMiddleware.create({
    limit: 100,
    windowMs: 60_000,
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Express",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

This configuration allows each client to make:

```text
100 requests every 60 seconds
```

Once the client exceeds the configured limit, InfluxGuard rejects further requests until the current rate-limit window resets.

---

## Protect only specific routes

You do not have to apply InfluxGuard globally.

You can protect individual routes:

```ts
import express from "express";
import { InfluxGuardMiddleware } from "influxguard";

const app = express();

const limiter = InfluxGuardMiddleware.create({
  limit: 5,
  windowMs: 60_000,
});

app.get("/public", (req, res) => {
  res.json({
    message: "Public endpoint",
  });
});

app.get("/protected", limiter, (req, res) => {
  res.json({
    message: "Rate limited endpoint",
  });
});

app.listen(3000);
```

In this example:

```text
/public       → not rate limited
/protected    → limited to 5 requests per minute
```

---

## Different limits for different routes

You can create multiple rate limiters:

```ts
import express from "express";
import { InfluxGuardMiddleware } from "influxguard";

const app = express();

const apiLimiter = InfluxGuardMiddleware.create({
  limit: 100,
  windowMs: 60_000,
});

const loginLimiter = InfluxGuardMiddleware.create({
  limit: 5,
  windowMs: 60_000,
});

app.use("/api", apiLimiter);

app.post("/login", loginLimiter, (req, res) => {
  res.json({
    message: "Login request accepted",
  });
});

app.listen(3000);
```

This can be useful for applying stricter limits to sensitive endpoints such as:

- login
- registration
- password reset
- OTP verification
- expensive API operations

---

# NestJS

InfluxGuard can also be used as a NestJS guard.

## Basic usage

Import the guard:

```ts
import { InfluxGuardGuard } from "influxguard";
```

Then apply it using NestJS's `@UseGuards()` decorator.

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { InfluxGuardGuard } from "influxguard";

@Controller("users")
export class UsersController {
  @Get()
  @UseGuards(
    InfluxGuardGuard.create({
      limit: 100,
      windowMs: 60_000,
    }),
  )
  findAll() {
    return {
      message: "Users endpoint",
    };
  }
}
```

The endpoint now allows:

```text
100 requests every 60 seconds per client
```

Requests exceeding the configured limit receive a `429 Too Many Requests` response.

---

## Protect an entire NestJS controller

You can apply the guard at controller level:

```ts
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { InfluxGuardGuard } from "influxguard";

@Controller("products")
@UseGuards(
  InfluxGuardGuard.create({
    limit: 100,
    windowMs: 60_000,
  }),
)
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

All routes inside the controller will use the same rate limit.

---

## Route-specific NestJS limits

Different endpoints can use different limits.

```ts
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { InfluxGuardGuard } from "influxguard";

@Controller("auth")
export class AuthController {
  @Post("login")
  @UseGuards(
    InfluxGuardGuard.create({
      limit: 5,
      windowMs: 60_000,
    }),
  )
  login(@Body() body: unknown) {
    return {
      message: "Login request accepted",
    };
  }

  @Post("register")
  @UseGuards(
    InfluxGuardGuard.create({
      limit: 3,
      windowMs: 60_000,
    }),
  )
  register(@Body() body: unknown) {
    return {
      message: "Registration request accepted",
    };
  }
}
```

For example:

```text
POST /auth/login
5 requests / minute

POST /auth/register
3 requests / minute
```

---

# Configuration

InfluxGuard accepts configuration through `InfluxGuardOptions`.

```ts
import type { InfluxGuardOptions } from "influxguard";
```

Example:

```ts
const options: InfluxGuardOptions = {
  limit: 100,
  windowMs: 60_000,
};
```

## `limit`

Maximum number of requests allowed within the configured window.

```ts
{
  limit: 100;
}
```

For example:

```text
limit: 100
```

means that a client can make up to 100 requests during the current window.

---

## `windowMs`

Duration of the rate-limit window in milliseconds.

For example:

```ts
{
  windowMs: 60_000;
}
```

represents:

```text
60,000 ms
= 60 seconds
= 1 minute
```

Some common values:

| Duration   |       Value |
| ---------- | ----------: |
| 1 second   |     `1_000` |
| 10 seconds |    `10_000` |
| 1 minute   |    `60_000` |
| 5 minutes  |   `300_000` |
| 15 minutes |   `900_000` |
| 1 hour     | `3_600_000` |

---

# Example configuration

Allow 60 requests every minute:

```ts
{
  limit: 60,
  windowMs: 60_000,
}
```

Allow 1,000 requests every hour:

```ts
{
  limit: 1_000,
  windowMs: 3_600_000,
}
```

Apply a strict login limit:

```ts
{
  limit: 5,
  windowMs: 60_000,
}
```

---

# Rate Limit Behavior

InfluxGuard tracks the number of requests made by a client during a configured time window.

For example:

```ts
{
  limit: 3,
  windowMs: 60_000,
}
```

A client's requests behave approximately like this:

```text
Request 1 → allowed
Request 2 → allowed
Request 3 → allowed
Request 4 → rejected
Request 5 → rejected

            ↓

       window expires

            ↓

Request 1 → allowed again
```

When the window expires, the request counter resets.

---

# HTTP Response

When a client exceeds the configured request limit, InfluxGuard returns:

```http
HTTP/1.1 429 Too Many Requests
```

This indicates that the client must wait until the current rate-limit window resets before making additional requests.

---

# Express vs NestJS

InfluxGuard exposes framework-specific integrations over the same rate-limiting behavior.

For Express:

```ts
import { InfluxGuardMiddleware } from "influxguard";
```

Use:

```ts
InfluxGuardMiddleware.create({
  limit: 100,
  windowMs: 60_000,
});
```

For NestJS:

```ts
import { InfluxGuardGuard } from "influxguard";
```

Use:

```ts
InfluxGuardGuard.create({
  limit: 100,
  windowMs: 60_000,
});
```

Conceptually:

```text
                    InfluxGuard
                        │
                Rate Limiting Core
                   /          \
                  /            \
                 ▼              ▼
          Express Adapter   NestJS Adapter
           Middleware          Guard
```

---

# TypeScript

InfluxGuard is written in TypeScript and ships with type declarations.

No additional `@types` package is required.

```ts
import { InfluxGuardMiddleware, type InfluxGuardOptions } from "influxguard";

const options: InfluxGuardOptions = {
  limit: 100,
  windowMs: 60_000,
};

const limiter = InfluxGuardMiddleware.create(options);
```

---

# ESM

InfluxGuard is distributed as an ES module.

Use standard ES module imports:

```ts
import { InfluxGuardMiddleware } from "influxguard";
```

Rather than:

```js
const influxGuard = require("influxguard");
```

---

# Express Example

Complete example:

```ts
import express from "express";
import { InfluxGuardMiddleware } from "influxguard";

const app = express();

app.use(express.json());

app.use(
  InfluxGuardMiddleware.create({
    limit: 100,
    windowMs: 60_000,
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "InfluxGuard is protecting this API",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

Install the dependencies:

```bash
npm install express influxguard
```

Run the server and repeatedly call:

```bash
curl http://localhost:3000
```

Once the configured request limit is exceeded, the server will respond with HTTP status `429`.

---

# NestJS Example

Install InfluxGuard in an existing NestJS application:

```bash
npm install influxguard
```

Then protect an endpoint:

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { InfluxGuardGuard } from "influxguard";

@Controller()
export class AppController {
  @Get()
  @UseGuards(
    InfluxGuardGuard.create({
      limit: 10,
      windowMs: 60_000,
    }),
  )
  getHello() {
    return {
      message: "InfluxGuard is protecting this endpoint",
    };
  }
}
```

Repeated requests exceeding the configured limit will receive:

```http
429 Too Many Requests
```

---

# Recommended Usage

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

Choose values appropriate for your application's expected traffic and security requirements.

---

# Package

npm:

```bash
npm install influxguard
```

Package name:

```text
influxguard
```

Current stable release:

```text
1.0.0
```

---

# License

MIT
