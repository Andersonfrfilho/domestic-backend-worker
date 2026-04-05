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

# Code quality
npm run lint                # Fix ESLint issues + import order
npm run lint:check          # Check without fixing
npm run format:all          # Prettier + lint
```

## Architecture

**Stack:** NestJS 11 + Fastify (health only), TypeScript, TypeORM + PostgreSQL, MongoDB (notifications), RabbitMQ (consumer).

**Purpose:** Async event processor. Consumes RabbitMQ queues and executes side effects (e-mail, push, DB updates, in-app notifications).

**Spec:** `.agents/skills/SPEC-WORKER.md`

### Module structure

```
src/modules/
├── shared/
│   ├── providers/database/   # TypeORM (Postgres + Mongo) — shared with API
│   ├── rabbitmq/             # WorkerRabbitMQModule — exchanges, queues, DLQ config
│   ├── email/                # NodemailerProvider — SMTP/SendGrid
│   └── firebase/             # FirebaseAdminProvider — FCM push
├── notification/             # Persiste notificações in-app no MongoDB
├── provider-approval/        # Consome provider.approved + provider.rejected
├── rating/                   # Consome review.created → recalcula average_rating
├── service-request-worker/   # Consome service_request.* (5 eventos)
├── email/                    # Consome notifications.email → envia via Nodemailer
├── push/                     # Consome notifications.push → envia via Firebase FCM
└── health/                   # Liveness/readiness
```

### Consumer pattern (per module)

```
Consumer (@RabbitSubscribe) → Handler (lógica) → Repository / Email / Firebase
```

- **Consumer:** Uma classe por fila. Captura exceções e re-lança para acionar NACK → DLX.
- **Handler:** Lógica de negócio pura, testável sem infraestrutura.
- **Idempotência:** Verificar estado atual antes de atualizar. Operações de recálculo são naturalmente idempotentes.

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

### E-mail templates (Handlebars)

Localizados em `src/modules/email/templates/*.hbs`. Template IDs:
`welcome`, `verification-approved`, `verification-rejected`,
`service-request-received`, `service-request-accepted`, `service-request-rejected`,
`service-request-completed`, `service-request-cancelled`, `request-reminder`

### Environment configuration

Validado via Joi em `src/config/env.validation.ts`.

Vars principais:
- `RABBITMQ_URL` — URI do RabbitMQ
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` — SMTP/SendGrid
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — FCM
- PostgreSQL + MongoDB — mesmas vars do domestic-backend-api

### TypeScript path aliases

```
@app/*      → src/*
@config/*   → src/config/*
@modules/*  → src/modules/*
```

### Testing conventions

- Unit test files: `*.unit.spec.ts`
- Mockar: AmqpConnection, TypeORM repositories, EmailProvider, FirebaseProvider
- Coverage threshold: 50% functions/lines/statements
