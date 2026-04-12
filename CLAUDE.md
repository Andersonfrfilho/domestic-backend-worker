# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev           # Watch mode
npm run start:dev:local     # Load .env.dev.local and watch

# Testing
npm run test:unit           # Unit tests (*.unit.spec.ts)
npm run test:unit:watch     # Unit tests watch mode
npm run test:unit:cov       # Unit tests with coverage report
npm run test:e2e            # E2E tests — requires RabbitMQ + PostgreSQL + MongoDB running
npm run test:all            # Both unit and E2E

# Code quality
npm run lint                # Fix ESLint issues + import order
npm run lint:check          # Check without fixing
npm run format:all          # Prettier + lint

# Database migrations
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Rollback last migration
npm run migration:generate  # Generate migration from entity changes
npm run migration:show      # Show migration status

# Flow tests (end-to-end business flows against a running environment)
npm run flows               # All modules
npm run flows:worker        # Worker module only
```

## Architecture

**Stack:** NestJS 11 + Fastify (health only), TypeScript, TypeORM + PostgreSQL, MongoDB (notifications), RabbitMQ consumer via `@golevelup/nestjs-rabbitmq`, Nodemailer (SMTP/SendGrid), Firebase Admin SDK (FCM).

**Purpose:** Async event processor. Consumes RabbitMQ queues and executes side effects (e-mail, push, DB updates, in-app notifications). Does **not** expose business endpoints, does **not** publish responses to the frontend, does **not** use cache.

**Spec:** `.agents/skills/SPEC-WORKER.md`

### Module structure

```
src/modules/
├── shared/
│   ├── providers/database/   # TypeORM (Postgres + Mongo)
│   ├── rabbitmq/             # WorkerRabbitMQModule — exchanges, queues, DLQ config
│   ├── email/                # NodemailerProvider — SMTP/SendGrid
│   └── firebase/             # FirebaseAdminProvider — FCM push
├── notification/             # Persiste notificações in-app no MongoDB
├── provider-approval/        # Consome provider.approved + provider.rejected
├── rating/                   # Consome review.created → recalcula average_rating
├── service-request-worker/   # Consome service_request.* (5 eventos)
├── email/                    # Consome notifications.email → envia via Nodemailer
├── push/                     # Consome notifications.push → envia via Firebase FCM
├── error/                    # Cross-cutting error handling
└── health/                   # Liveness/readiness
```

> **Dead modules** (copied from API, NOT imported in app.module.ts, should be deleted):
> `category`, `document`, `phone`, `provider`, `review`, `service`, `service-request`, `user`

### Consumer pattern (per module)

```
Consumer (@RabbitSubscribe) → Handler (lógica) → Repository / Email / Firebase
```

Each module follows the pattern:
```
<module>/
├── <module>.module.ts
├── <module>.consumer.ts          # @RabbitSubscribe entry point
├── <module>.consumer.unit.spec.ts
├── <module>.handler.ts           # Business logic (pure, testable)
├── <module>.handler.unit.spec.ts
└── dtos/
    └── <event-name>.event.dto.ts
```

- **Consumer:** One class per queue. Catches exceptions and re-throws to trigger NACK → DLX.
- **Handler:** Pure business logic, testable without infrastructure.
- **Idempotence:** Check current state before updating. Recalculation operations are naturally idempotent.

### ACK/NACK strategy

- Success → implicit ACK (return normally)
- Recoverable error (timeout, 5xx) → throw error → NACK → DLX → retry
- Non-recoverable (invalid data, 4xx) → ACK + log error (do not retry)

### RabbitMQ Topology

| Queue | Routing Keys | Handler |
|---|---|---|
| `worker.provider.approval` | `provider.approved`, `provider.rejected` | `ProviderApprovalConsumer` |
| `worker.rating` | `review.created` | `RatingConsumer` |
| `worker.service-requests` | `service_request.*` | `ServiceRequestConsumer` |
| `worker.notifications` | `notifications.email` | `EmailConsumer` |
| `worker.notifications` | `notifications.push` | `PushConsumer` |
| `worker.dlq` | — (DLX fanout) | Dead letter queue |

Exchange principal: `zolve.events` (topic, durable)
DLX: `zolve.dlx` (fanout, durable) → `worker.dlq`
Retry: max 3x via `x-retry-count` header, TTL 1min between retries.

### E-mail templates (Handlebars)

Located at `src/modules/email/templates/*.hbs`. Template IDs:
`welcome`, `verify-email`, `verification-approved`, `verification-rejected`,
`service-request-received`, `service-request-accepted`, `service-request-rejected`,
`service-request-completed`, `service-request-cancelled`, `request-reminder`

### Environment configuration

Validated via Joi schema in `src/config/env.validation.ts`. This is the authoritative reference for all config options. E2E tests use `.env.e2e`.

Key vars:
- `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`, `RABBITMQ_PREFETCH`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `POSTGRES_HOST/PORT/DB/USER/PASSWORD`
- `MONGO_URI`
- `WORKER_MAX_RETRIES`, `WORKER_RETRY_DELAY_MS`, `WORKER_DLQ_ENABLED`

### Internal library versions

Always keep `@adatechnology/*` dependencies at the correct versions:

| Lib | Version | Used for |
|---|---|---|
| `@adatechnology/logger` | `^0.0.9` | Structured logging via `LOGGER_PROVIDER` |

> **Not needed in this service** (worker is a queue consumer with no auth, no cache, no HTTP calls):
> `@adatechnology/auth-keycloak`, `@adatechnology/cache`, `@adatechnology/http-client`

### TypeScript path aliases

```
@app/*      → src/*
@config/*   → src/config/*
@modules/*  → src/modules/*
```

### Logging conventions

Every handler and consumer must have structured logs via `LOGGER_PROVIDER` (`@adatechnology/logger`).

**Log context** — derive from the class name directly, never hardcode a string:

```ts
private readonly logContext = `${this.constructor.name}.handle`;
```

**Constants file** (`*.constants.ts`) — contains only `LOG_MESSAGES`, never `LOG_CONTEXT`:

```ts
export const PROVIDER_APPROVAL_LOG_MESSAGES = {
  START_FLOW: 'Processing provider approval event',
  ALREADY_PROCESSED: 'Event already processed, skipping (idempotent)',
  PROCESSED_SUCCESS: 'Provider approval processed successfully',
} as const;
```

**Log points per handler:**
- `info` at the start of `handle()` with `message_id` and relevant payload fields
- `warn` before every skipped/ignored message (idempotence check)
- `warn` before every thrown error
- `info` on successful completion

### Testing conventions

- Unit test files: `*.unit.spec.ts`
- Mock: `AmqpConnection`, TypeORM repositories, `EmailProvider`, `FirebaseProvider`
- Coverage threshold: 50% functions/lines/statements
- Every module needs both `*.consumer.unit.spec.ts` and `*.handler.unit.spec.ts`

### Flow tests (Spec-Driven)

Every module must have a corresponding flow test in `scripts/flows/<module>.flow.js`. Flow tests verify end-to-end business behavior against a running environment with real queues.

**When to create or update:**
- When a new consumer is added → create `scripts/flows/<module>.flow.js`
- When a handler's behavior changes → update the corresponding flow

**Rules:**
- Each flow exports an array of flow objects consumed by `scripts/flows/index.js`
- The `setup` function must clean up state left by previous failed runs
- Steps must capture IDs from responses and pass them to subsequent steps via `ctx`
- Required steps (default) abort the flow on failure; optional steps (`required: false`) continue
- Do not use `faker` — fixed, readable data makes log debugging easier
- Auth tokens obtained via Keycloak (`lib/auth.js`) — never hardcode tokens

**Running:**
```bash
npm run flows          # all modules
npm run flows:worker   # single module
```
