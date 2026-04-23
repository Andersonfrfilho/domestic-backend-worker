"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqp_1 = require("./lib/amqp");
const runner_1 = require("./lib/runner");
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const connectivityFlow = {
    name: 'Worker — Connectivity Check',
    steps: [
        {
            name: 'GET /health — worker online',
            request: () => ({ method: 'GET', path: `${BASE_URL}/health` }),
            expect: (res, ctx) => {
                const body = res.json;
                ctx.healthStatus = String(body?.['status']);
                return [
                    { label: 'status 200', ok: res.status === 200, detail: `got ${res.status}` },
                    {
                        label: 'status is ok',
                        ok: body?.['status'] === 'ok',
                        detail: String(body?.['status']),
                    },
                ];
            },
        },
    ],
};
const PROVIDER_ID = process.env.FLOW_PROVIDER_ID ?? '00000000-0000-0000-0000-000000000001';
const ratingFlow = {
    name: 'Worker — Rating Consumer Flow',
    setup: async (ctx) => {
        ctx.providerId = PROVIDER_ID;
    },
    steps: [
        {
            name: 'Publish review.created event',
            request: (ctx) => ({
                method: 'POST',
                path: '/__flow/publish',
                body: { routingKey: 'review.created', providerId: ctx.providerId },
            }),
            expect: () => [],
            capture: (_res, ctx) => {
                void (async () => {
                    await (0, amqp_1.publishEvent)('review.created', {
                        review_id: '00000000-flow-test-review-000000000001',
                        provider_id: ctx.providerId,
                        rating: 5,
                    });
                    await (0, amqp_1.sleep)(1500);
                })();
            },
            required: false,
        },
    ],
};
const serviceRequestFlow = {
    name: 'Worker — ServiceRequest Consumer Flow',
    setup: async (ctx) => {
        ctx.requestId = '00000000-flow-test-srequest-00000001';
    },
    steps: [
        {
            name: 'Publish service_request.created event',
            request: () => ({ method: 'POST', path: '/__flow/noop', body: {} }),
            expect: () => [],
            capture: (_res, ctx) => {
                void (async () => {
                    await (0, amqp_1.publishEvent)('service_request.created', {
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
                    await (0, amqp_1.sleep)(1500);
                })();
            },
            required: false,
        },
    ],
};
const providerApprovalFlow = {
    name: 'Worker — ProviderApproval Consumer Flow',
    steps: [
        {
            name: 'Publish provider.approved event',
            request: () => ({ method: 'POST', path: '/__flow/noop', body: {} }),
            expect: () => [],
            capture: () => {
                void (async () => {
                    await (0, amqp_1.publishEvent)('provider.approved', {
                        provider_id: PROVIDER_ID,
                        user_id: '00000000-0000-0000-0000-000000000010',
                        email: 'provider@flowtest.com',
                        fcm_token: 'fcm-flow-test-token',
                    });
                    await (0, amqp_1.sleep)(1500);
                })();
            },
            required: false,
        },
    ],
};
exports.default = [connectivityFlow, ratingFlow, serviceRequestFlow, providerApprovalFlow];
if (process.argv[1]?.endsWith('worker.flow.ts')) {
    (0, runner_1.runAll)([connectivityFlow, ratingFlow, serviceRequestFlow, providerApprovalFlow]).catch((err) => {
        console.error('Worker flow runner crashed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=worker.flow.js.map