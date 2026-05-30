import { LOGGER_PROVIDER, runWithContext, extractAmqpContext } from '@adatechnology/nestjs-logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { ProviderRegisteredEvent } from './dtos/provider-registered.event.dto';
import { ProviderRegisteredHandler } from './provider-registered.handler';

@Injectable()
export class ProviderRegisteredConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: ProviderRegisteredHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'user.registered.provider',
    queue: 'worker.provider.registered',
  })
  @TraceMethod()
  async onProviderRegistered(
    payload: ProviderRegisteredEvent,
    amqpMsg: ConsumeMessage,
  ): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:provider-registered:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
        this.logger.info({
          message: '[user.registered.provider] Received',
          context: this.logContext,
          params: { userId: payload.userId, providerProfileId: payload.providerProfileId },
        });
        try {
          await this.handler.handle(payload);
          this.logger.info({
            message: '[user.registered.provider] Done',
            context: this.logContext,
            params: { userId: payload.userId },
          });
          this.metrics.record('worker.provider.registered', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[user.registered.provider] Failed — will NACK',
            context: this.logContext,
            params: { userId: payload.userId, error: error?.message },
          });
          this.metrics.record('worker.provider.registered', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }
}
