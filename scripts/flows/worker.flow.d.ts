import { type Flow } from './lib/runner';
interface WorkerCtx extends Record<string, unknown> {
    healthStatus?: string;
}
interface RatingCtx extends Record<string, unknown> {
    providerId: string;
}
interface ServiceRequestCtx extends Record<string, unknown> {
    requestId: string;
}
declare const _default: (Flow<WorkerCtx> | Flow<RatingCtx> | Flow<ServiceRequestCtx>)[];
export default _default;
