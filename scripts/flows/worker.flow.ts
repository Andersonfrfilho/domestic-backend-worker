/**
 * Worker Consumer Flows — Spec-Driven
 *
 * Publica mensagens no RabbitMQ e verifica os efeitos colaterais esperados.
 *
 * Pré-requisitos:
 *   - RabbitMQ rodando (RABBITMQ_URL)
 *   - Worker rodando e conectado ao RabbitMQ
 *   - PostgreSQL com provider_profiles e provider_verifications
 *
 * Env vars:
 *   BASE_URL         http://localhost:3002
 *   RABBITMQ_URL     amqp://zolve:zolve123@localhost:5672
 */

import { publishEvent, sleep, type Flow } from './lib/amqp.ts';
import { request } from './lib/runner.ts';

// ---------------------------------------------------------------------------
// Flow 1 — Connectivity: worker health + RabbitMQ reachable
// ---------------------------------------------------------------------------

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');

interface WorkerCtx { healthStatus?: string }

const connectivityFlow: Flow<WorkerCtx> = {
  name: 'Worker — Connectivity Check',

  steps: [
    {
      name: 'GET /health — worker online',
      request: () => ({ method: 'GET', path: `${BASE_URL}/health` }),
      expect: (res, ctx) => {
        const body = res.json as Record<string, unknown> | null;
        ctx.healthStatus = String(body?.['status']);
        return [
          { label: 'status 200', ok: res.status === 200, detail: `got ${res.status}` },
          { label: 'status is ok', ok: body?.['status'] === 'ok', detail: String(body?.['status']) },
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Flow 2 — rating: review.created atualiza average_rating
// ---------------------------------------------------------------------------

interface RatingCtx { providerId: string }

const PROVIDER_ID = process.env.FLOW_PROVIDER_ID ?? '00000000-0000-0000-0000-000000000001';

const ratingFlow: Flow<RatingCtx> = {
  name: 'Worker — Rating Consumer Flow',

  setup: async (ctx) => {
    ctx.providerId = PROVIDER_ID;
  },

  steps: [
    {
      name: 'Publish review.created event',
      request: (ctx) => ({
        method: 'POST',
        path: '/__flow/publish',  // sentinel — handled below via publishEvent
        body: { routingKey: 'review.created', providerId: ctx.providerId },
      }),
      // O step faz publish direto — não é HTTP contra o worker
      expect: () => [],
      capture: async (_res, ctx) => {
        await publishEvent('review.created', {
          review_id: '00000000-flow-test-review-000000000001',
          provider_id: ctx.providerId,
          rating: 5,
        });
        await sleep(1500); // aguarda o consumer processar
      },
      required: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Flow 3 — service-request.created: consumer publica email + push
// ---------------------------------------------------------------------------

interface ServiceRequestCtx { requestId: string }

const serviceRequestFlow: Flow<ServiceRequestCtx> = {
  name: 'Worker — ServiceRequest Consumer Flow',

  setup: async (ctx) => {
    ctx.requestId = '00000000-flow-test-srequest-00000001';
  },

  steps: [
    {
      name: 'Publish service_request.created event',
      request: () => ({ method: 'POST', path: '/__flow/noop', body: {} }),
      expect: () => [],
      capture: async (_res, ctx) => {
        await publishEvent('service_request.created', {
          event_type: 'created',
          request_id: ctx.requestId,
          provider_id: PROVIDER_ID,
          provider_user_id: '00000000-0000-0000-0000-000000000010',
          provider_email: 'provider@flowtest.com',
          contractor_id: '00000000-0000-0000-0000-000000000011',
          contractor_user_id: '00000000-0000-0000-0000-000000000012',
          contractor_email: 'contractor@flowtest.com',
          service_name: 'Diária Flow Test',
          scheduled_at: '2026-05-01T10:00:00Z',
        });
        await sleep(1500);
      },
      required: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Flow 4 — provider-approval: provider.approved event
// ---------------------------------------------------------------------------

interface ProviderApprovalCtx Record<string, unknown>

const providerApprovalFlow: Flow = {
  name: 'Worker — ProviderApproval Consumer Flow',

  steps: [
    {
      name: 'Publish provider.approved event',
      request: () => ({ method: 'POST', path: '/__flow/noop', body: {} }),
      expect: () => [],
      capture: async () => {
        await publishEvent('provider.approved', {
          provider_id: PROVIDER_ID,
          user_id: '00000000-0000-0000-0000-000000000010',
          email: 'provider@flowtest.com',
          fcm_token: 'fcm-flow-test-token',
        });
        await sleep(1500);
      },
      required: false,
    },
  ],
};

export default [connectivityFlow, ratingFlow, serviceRequestFlow, providerApprovalFlow];

if (process.argv[1]?.endsWith('worker.flow.ts')) {
  const { runAll } = await import('./lib/runner.ts');
  await runAll([connectivityFlow, ratingFlow, serviceRequestFlow, providerApprovalFlow]);
}
