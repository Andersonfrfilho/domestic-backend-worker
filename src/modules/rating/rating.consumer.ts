import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { RatingHandler } from './rating.handler';
import type { ReviewCreatedEvent } from './dtos/review-created.event.dto';

@Injectable()
export class RatingConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: RatingHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'review.created',
    queue: 'worker.rating',
    queueOptions: { durable: true, arguments: { 'x-dead-letter-exchange': 'zolve.dlx' } },
  })
  async onReviewCreated(payload: ReviewCreatedEvent): Promise<void> {
    this.logger.info({ message: '[review.created] Received', context: this.logContext, params: { provider_id: payload.provider_id } });
    try {
      await this.handler.handle(payload);
      this.logger.info({ message: '[review.created] Done', context: this.logContext, params: { provider_id: payload.provider_id } });
    } catch (error) {
      this.logger.error({ message: '[review.created] Failed — will NACK', context: this.logContext, params: { provider_id: payload.provider_id, error: error?.message } });
      throw error;
    }
  }
}
