import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { PushHandler } from './push.handler';
import type { PushEvent } from './dtos/push.event.dto';

@Injectable()
export class PushConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: PushHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.push',
    queue: 'worker.notifications',
    queueOptions: { durable: true, arguments: { 'x-dead-letter-exchange': 'zolve.dlx' } },
  })
  async onPushEvent(payload: PushEvent): Promise<void> {
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
    } catch (error) {
      this.logger.error({
        message: '[notifications.push] Failed — will NACK',
        context: this.logContext,
        params: { user_id: payload.user_id, error: error?.message },
      });
      throw error;
    }
  }
}
