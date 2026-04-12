/**
 * Flow runner — Spec-Driven integration tests (worker)
 *
 * Usage:
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/flows/index.ts
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/flows/index.ts worker
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/flows/index.ts health
 *
 * Env vars:
 *   BASE_URL         http://localhost:3002
 *   RABBITMQ_URL     amqp://zolve:zolve123@localhost:5672
 *   FLOW_PROVIDER_ID UUID do provider_profile a usar nos testes
 */

import { runAll, type Flow } from './lib/runner.ts';
import healthFlows from './health.flow.ts';
import workerFlows from './worker.flow.ts';

const MODULES: Record<string, Flow[]> = {
  health: healthFlows,
  worker: workerFlows,
};

async function main(): Promise<void> {
  const target = process.argv[2];

  let flows: Flow[];
  if (target) {
    if (!MODULES[target]) {
      console.error(`Unknown module: "${target}". Available: ${Object.keys(MODULES).join(', ')}`);
      process.exit(1);
    }
    flows = MODULES[target];
  } else {
    flows = Object.values(MODULES).flat();
  }

  await runAll(flows);
}

main().catch((err: unknown) => {
  console.error('Flow runner crashed:', err);
  process.exit(1);
});
