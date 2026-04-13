import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { EmailHandler } from './email.handler';
import type { EmailEvent } from './dtos/email.event.dto';

@Injectable()
export class EmailConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: EmailHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.email',
    queue: 'worker.notifications',
    queueOptions: { durable: true, arguments: { 'x-dead-letter-exchange': 'zolve.dlx' } },
  })
  async onEmailEvent(payload: EmailEvent): Promise<void> {
    this.logger.info({
      message: '[notifications.email] Received',
      context: this.logContext,
      params: { to: payload.to, template_id: payload.template_id },
    });

    try {
      await this.handler.handle(payload);
      this.logger.info({
        message: '[notifications.email] Done',
        context: this.logContext,
        params: { to: payload.to },
      });
    } catch (error) {
      this.logger.error({
        message: '[notifications.email] Failed — will NACK',
        context: this.logContext,
        params: { to: payload.to, error: error?.message },
      });
      throw error;
    }
  }
}
