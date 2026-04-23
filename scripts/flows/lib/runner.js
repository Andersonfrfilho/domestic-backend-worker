"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
exports.runFlow = runFlow;
exports.runAll = runAll;
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const pass = (msg) => `${GREEN}✓${RESET} ${msg}`;
const fail = (msg) => `${RED}✗${RESET} ${msg}`;
const info = (msg) => `${CYAN}→${RESET} ${msg}`;
const warn = (msg) => `${YELLOW}⚠${RESET}  ${msg}`;
async function request(method, path, { body, headers = {} } = {}) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    let reqBody;
    let baseHeaders = {};
    if (body !== undefined) {
        reqBody = JSON.stringify(body);
        baseHeaders = { 'Content-Type': 'application/json' };
    }
    const opts = {
        method,
        headers: { ...baseHeaders, ...headers },
        body: reqBody,
    };
    const start = Date.now();
    const res = await fetch(url, opts);
    const ms = Date.now() - start;
    let json = null;
    const text = await res.text();
    try {
        json = JSON.parse(text);
    }
    catch {
    }
    return { status: res.status, json, text, ms };
}
async function runFlow(flow) {
    console.log(`\n${BOLD}${CYAN}▶ ${flow.name}${RESET}`);
    console.log('─'.repeat(50));
    const ctx = {};
    let passed = 0;
    let failed = 0;
    if (flow.setup) {
        console.log(info('Setup...'));
        try {
            await flow.setup(ctx);
            console.log(`  ${pass('Setup OK')}`);
        }
        catch (err) {
            console.log(`  ${fail(`Setup failed: ${err.message}`)}`);
            return { passed: 0, failed: 1 };
        }
    }
    for (const step of flow.steps) {
        const stepName = typeof step.name === 'function' ? step.name(ctx) : step.name;
        console.log(`\n  ${BOLD}${stepName}${RESET}`);
        if (step.skip?.(ctx)) {
            console.log(`  ${DIM}(skipped)${RESET}`);
            continue;
        }
        let res;
        try {
            const req = step.request(ctx);
            const url = req.path.startsWith('http') ? req.path : `${BASE_URL}${req.path}`;
            console.log(`  ${DIM}${req.method} ${url}${RESET}`);
            res = await request(req.method, req.path, { body: req.body, headers: req.headers });
            console.log(`  ${DIM}${res.status} — ${res.ms}ms${RESET}`);
        }
        catch (err) {
            console.log(`    ${fail(`Request error: ${err.message}`)}`);
            failed++;
            if (step.required !== false)
                break;
            continue;
        }
        const assertions = step.expect?.(res, ctx) ?? [];
        for (const { label, ok, detail } of assertions) {
            if (ok) {
                console.log(`    ${pass(label)}`);
                passed++;
            }
            else {
                console.log(`    ${fail(label)}${detail ? `  ${DIM}${detail}${RESET}` : ''}`);
                failed++;
            }
        }
        const stepFailed = assertions.some((a) => !a.ok);
        if (stepFailed && res.json) {
            console.log(`    ${DIM}response: ${JSON.stringify(res.json)}${RESET}`);
        }
        if (step.capture) {
            try {
                await step.capture(res, ctx);
            }
            catch (err) {
                console.log(`    ${warn(`capture error: ${err.message}`)}`);
            }
        }
        if (stepFailed && step.required !== false) {
            console.log(`    ${warn('Step required — aborting flow')}`);
            failed++;
            break;
        }
    }
    if (flow.teardown) {
        try {
            await flow.teardown(ctx);
        }
        catch (err) {
            console.log(`  ${warn(`Teardown error: ${err.message}`)}`);
        }
    }
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${BOLD}${passed > 0 && failed === 0 ? GREEN : RED}${passed} passed, ${failed} failed${RESET}\n`);
    return { passed, failed };
}
async function runAll(flows) {
    let totalPassed = 0;
    let totalFailed = 0;
    for (const flow of flows) {
        const { passed, failed } = await runFlow(flow);
        totalPassed += passed;
        totalFailed += failed;
    }
    console.log(`${BOLD}${'═'.repeat(51)}`);
    console.log(`  Total: ${totalPassed + totalFailed} assertions`);
    console.log(`  \x1b[32mPassed: ${totalPassed}\x1b[0m  ${totalFailed > 0 ? '\x1b[31m' : ''}${BOLD}Failed: ${totalFailed}\x1b[0m`);
    console.log(`${'═'.repeat(51)}\x1b[0m\n`);
    if (totalFailed > 0)
        process.exit(1);
}
//# sourceMappingURL=runner.js.map