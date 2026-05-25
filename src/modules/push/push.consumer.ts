import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { extractAmqpContext } from '@adatechnology/logger';

import type { PushEvent } from './dtos/push.event.dto';
import { PushHandler } from './push.handler';

@Injectable()
export class PushConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: PushHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.push',
    queue: 'worker.notifications',
  })
  @TraceMethod()
  async onPushEvent(payload: PushEvent, amqpMsg: ConsumeMessage): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:push:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
        this.logger.info({
          message: '[notifications.push] Received',
          context: this.logContext,
          params: { user_id: payload.user_id },
        });

        try {
          await this.handler.handle(payload);
          this.logger.info({
            message: '[notifications.push] Done',
            context: this.logContext,
            params: { user_id: payload.user_id },
          });
          this.metrics.record('worker.notifications', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[notifications.push] Failed — will NACK',
            context: this.logContext,
            params: { user_id: payload.user_id, error: error?.message },
          });
          this.metrics.record('worker.notifications', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }
}
