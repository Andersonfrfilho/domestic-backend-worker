import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';

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
  async onReviewCreated(payload: ReviewCreatedEvent): Promise<void> {
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
  }
}
