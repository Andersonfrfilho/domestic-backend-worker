import { context, propagation } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

export interface AmqpExtractedContext {
  /** requestId propagado pelo produtor (API) via header x-request-id */
  requestId: string | undefined;
  /** Contexto OTel extraído dos headers W3C traceparent/tracestate */
  parentCtx: ReturnType<typeof context.active>;
}

/**
 * Extrai requestId e contexto OTel dos headers de uma mensagem AMQP.
 *
 * Uso nos consumers:
 * ```ts
 * async onEvent(payload: T, amqpMsg: ConsumeMessage): Promise<void> {
 *   const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
 *   const requestId = propagatedId ?? `msg:type:${Date.now().toString(36)}`;
 *   return context.with(parentCtx, () =>
 *     runWithContext({ requestId }, async () => { ... })
 *   );
 * }
 * ```
 */
export function extractAmqpContext(amqpMsg: ConsumeMessage | undefined): AmqpExtractedContext {
  const headers = ((amqpMsg?.properties?.headers as Record<string, unknown>) ?? {}) as Record<
    string,
    string
  >;
  const requestId = headers['x-request-id'] || undefined;
  // Extrai traceparent + tracestate → mantém o trace do producer no Jaeger
  const parentCtx = propagation.extract(context.active(), headers);
  return { requestId, parentCtx };
}
