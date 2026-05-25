import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { extractAmqpContext } from '@adatechnology/logger';

import type { ProviderApprovalEvent } from './dtos/provider-approval.event.dto';
import { ProviderApprovalHandler } from './provider-approval.handler';

@Injectable()
export class ProviderApprovalConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: ProviderApprovalHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'provider.approved',
    queue: 'worker.provider.approval',
  })
  @TraceMethod()
  async onProviderApproved(payload: ProviderApprovalEvent, amqpMsg: ConsumeMessage): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:provider-approved:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
        this.logger.info({
          message: '[provider.approved] Received',
          context: this.logContext,
          params: { provider_id: payload.provider_id },
        });
        try {
          await this.handler.handleApproved(payload);
          this.logger.info({
            message: '[provider.approved] Done',
            context: this.logContext,
            params: { provider_id: payload.provider_id },
          });
          this.metrics.record('worker.provider.approval', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[provider.approved] Failed — will NACK',
            context: this.logContext,
            params: { provider_id: payload.provider_id, error: error?.message },
          });
          this.metrics.record('worker.provider.approval', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'provider.rejected',
    queue: 'worker.provider.approval',
  })
  @TraceMethod()
  async onProviderRejected(payload: ProviderApprovalEvent, amqpMsg: ConsumeMessage): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:provider-rejected:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        this.logger.info({
          message: '[provider.rejected] Received',
          context: this.logContext,
          params: { provider_id: payload.provider_id },
        });
        try {
          await this.handler.handleRejected(payload);
          this.logger.info({
            message: '[provider.rejected] Done',
            context: this.logContext,
            params: { provider_id: payload.provider_id },
          });
        } catch (error) {
          this.logger.error({
            message: '[provider.rejected] Failed — will NACK',
            context: this.logContext,
            params: { provider_id: payload.provider_id, error: error?.message },
          });
          throw error;
        }
      }),
    );
  }
}
