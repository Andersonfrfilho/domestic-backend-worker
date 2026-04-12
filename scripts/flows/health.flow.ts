/**
 * Health Flow — verifica que o worker está de pé e respondendo no health endpoint.
 */
import { request, type Flow, type Assertion, type RequestResponse } from './lib/runner.ts';

type JsonBody = Record<string, unknown> | null;

function statusIs(res: RequestResponse, ...codes: number[]): Assertion {
  return { label: `status ${codes.join(' or ')}`, ok: codes.includes(res.status), detail: `got ${res.status}` };
}

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');

const healthFlow: Flow = {
  name: 'Worker — Health Check Flow',

  steps: [
    {
      name: 'GET /health — worker está de pé',
      request: () => ({ method: 'GET', path: `${BASE_URL}/health` }),
      expect: (res) => {
        const body = res.json as JsonBody;
        return [
          statusIs(res, 200),
          { label: 'status is ok', ok: body?.['status'] === 'ok', detail: String(body?.['status']) },
        ];
      },
    },
  ],
};

export default [healthFlow];

if (process.argv[1]?.endsWith('health.flow.ts')) {
  const { runAll } = await import('./lib/runner.ts');
  await runAll([healthFlow]);
}
