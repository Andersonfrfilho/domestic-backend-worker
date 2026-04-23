export interface RequestResponse {
    status: number;
    json: unknown;
    text: string;
    ms: number;
}
export interface Assertion {
    label: string;
    ok: boolean;
    detail?: string;
}
export interface FlowStep<Ctx extends object = Record<string, unknown>> {
    name: string | ((ctx: Ctx) => string);
    request: (ctx: Ctx) => {
        method: string;
        path: string;
        body?: unknown;
        headers?: Record<string, string>;
    };
    expect?: (res: RequestResponse, ctx: Ctx) => Assertion[];
    capture?: (res: RequestResponse, ctx: Ctx) => void | Promise<void>;
    skip?: (ctx: Ctx) => boolean;
    required?: boolean;
}
export interface Flow<Ctx extends object = Record<string, unknown>> {
    name: string;
    setup?: (ctx: Ctx) => Promise<void>;
    steps: FlowStep<Ctx>[];
    teardown?: (ctx: Ctx) => Promise<void>;
}
export declare function request(method: string, path: string, { body, headers }?: {
    body?: unknown;
    headers?: Record<string, string>;
}): Promise<RequestResponse>;
export declare function runFlow<Ctx extends object>(flow: Flow<Ctx>): Promise<{
    passed: number;
    failed: number;
}>;
export declare function runAll(flows: Flow[]): Promise<void>;
