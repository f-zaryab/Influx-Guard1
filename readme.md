# InfluxGuard

A lightweight and extensible rate limiter for Node.js applications, with support for **Express** and **NestJS**.

> **Status:** 🚧 In active development — not yet ready for production use.

## Overview

InfluxGuard is a rate-limiting library designed to provide a simple way to control incoming request traffic in Node.js applications.

The project aims to provide a framework-agnostic rate-limiting core with dedicated integrations for Express and NestJS.

## Goals

* Simple and lightweight API
* Framework-agnostic rate-limiting core
* Express middleware support
* NestJS guard/module support
* Configurable request limits and time windows
* Multiple storage strategies
* TypeScript-first API
* Minimal runtime dependencies

## Planned Features

* In-memory rate limiting
* Express middleware
* NestJS integration
* Custom rate-limit configuration
* Standard rate-limit response headers
* Custom client/key identification
* Redis-backed distributed rate limiting
* Multiple rate-limiting algorithms
* Custom storage adapters

## Installation

InfluxGuard is currently under development and has not yet been released for production use.

Once published:

```bash
npm install influxguard
```

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Start the build in watch mode:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run tests once:

```bash
npm run test:run
```

Run TypeScript type checking:

```bash
npm run typecheck
```

## Project Structure

```text
influxguard/
├── src/
│   ├── core/
│   ├── express/
│   ├── nestjs/
│   └── index.ts
├── tests/
├── tsdown.config.ts
├── tsconfig.json
└── package.json
```

### Core

Contains the framework-independent rate-limiting logic.

### Express

Contains the Express middleware integration.

### NestJS

Contains NestJS-specific integration such as guards, decorators, and modules.

## Build

InfluxGuard is written in TypeScript and built using `tsdown`.

```bash
npm run build
```

The generated package is written to:

```text
dist/
```

## Testing

InfluxGuard uses Vitest for automated testing.

```bash
npm run test
```

## Requirements

* Node.js 20+
* TypeScript 5+
* Express 5+ for Express integration
* NestJS 11+ for NestJS integration

## Roadmap

The initial development roadmap is:

1. Implement the rate limiter core
2. Implement an in-memory store
3. Add Express middleware
4. Add rate-limit headers
5. Add NestJS integration
6. Add configurable key generation
7. Add Redis storage
8. Add additional rate-limiting algorithms
9. Improve observability and production configuration

## Contributing

InfluxGuard is currently in early development. Contribution guidelines will be added as the project matures.

## License

MIT
