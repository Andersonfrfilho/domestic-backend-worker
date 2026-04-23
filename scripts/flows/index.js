"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("./lib/runner");
const health_flow_1 = __importDefault(require("./health.flow"));
const worker_flow_1 = __importDefault(require("./worker.flow"));
const MODULES = {
    health: health_flow_1.default,
    worker: worker_flow_1.default,
};
async function main() {
    const target = process.argv[2];
    let flows;
    if (target) {
        if (!MODULES[target]) {
            console.error(`Unknown module: "${target}". Available: ${Object.keys(MODULES).join(', ')}`);
            process.exit(1);
        }
        flows = MODULES[target];
    }
    else {
        flows = Object.values(MODULES).flat();
    }
    await (0, runner_1.runAll)(flows);
}
main().catch((err) => {
    console.error('Flow runner crashed:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map