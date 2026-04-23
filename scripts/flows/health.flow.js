"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("./lib/runner");
function statusIs(res, ...codes) {
    return {
        label: `status ${codes.join(' or ')}`,
        ok: codes.includes(res.status),
        detail: `got ${res.status}`,
    };
}
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const healthFlow = {
    name: 'Worker — Health Check Flow',
    steps: [
        {
            name: 'GET /health — worker está de pé',
            request: () => ({ method: 'GET', path: `${BASE_URL}/health` }),
            expect: (res) => {
                const body = res.json;
                return [
                    statusIs(res, 200),
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
exports.default = [healthFlow];
if (process.argv[1]?.endsWith('health.flow.ts')) {
    (0, runner_1.runAll)([healthFlow]).catch((err) => {
        console.error('Health flow runner crashed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=health.flow.js.map