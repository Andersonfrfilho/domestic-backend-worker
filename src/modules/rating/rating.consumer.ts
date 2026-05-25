import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { extractAmqpContext } from '@modules/shared/rabbitmq/amqp-context.helper';

import type { ReviewCreatedEvent } from './dtos/review-created.event.dto';
import { RatingHandler } from './rating.handler';

@Injectable()
export class RatingConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: RatingHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'review.created',
    queue: 'worker.rating',
  })
  @TraceMethod()
  async onReviewCreated(payload: ReviewCreatedEvent, amqpMsg: ConsumeMessage): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:rating:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
        this.logger.info({
          message: '[review.created] Received',
          context: this.logContext,
          params: { provider_id: payload.provider_id },
        });
        try {
          await this.handler.handle(payload);
          this.logger.info({
            message: '[review.created] Done',
            context: this.logContext,
            params: { provider_id: payload.provider_id },
          });
          this.metrics.record('worker.rating', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[review.created] Failed — will NACK',
            context: this.logContext,
            params: { provider_id: payload.provider_id, error: error?.message },
          });
          this.metrics.record('worker.rating', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }
}
