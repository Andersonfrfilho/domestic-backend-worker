import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { NOTIFICATION_PROVIDER } from './notification.token';
import type { NotificationProviderInterface, NotificationType } from './providers/notification.interface';

interface NotificationEvent {
  to: string;
  type: NotificationType;
  message?: string;
  template_id?: string;
  variables?: Record<string, string>;
}

@Injectable()
export class NotificationConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    @Inject(NOTIFICATION_PROVIDER)
    private readonly provider: NotificationProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.sms',
    queue: 'worker.notifications.sms',
  })
  async onSmsEvent(event: NotificationEvent): Promise<void> {
    await this.handle(event, 'sms');
  }

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.whatsapp',
    queue: 'worker.notifications.whatsapp',
  })
  async onWhatsAppEvent(event: NotificationEvent): Promise<void> {
    await this.handle(event, 'whatsapp');
  }

  private async handle(event: NotificationEvent, type: NotificationType): Promise<void> {
    const message = event.message || '[Mensagem automática]';

    this.logger.info({
      message: `[notifications.${type}] Received`,
      context: this.logContext,
      params: { to: event.to, template_id: event.template_id },
    });

    try {
      await this.provider.send({
        to: event.to,
        message,
        type,
        templateId: event.template_id,
        variables: event.variables,
      });

      this.logger.info({
        message: `[notifications.${type}] Sent successfully`,
        context: this.logContext,
        params: { to: event.to },
      });
    } catch (error: any) {
      this.logger.error({
        message: `[notifications.${type}] Failed`,
        context: this.logContext,
        params: { to: event.to, error: error.message },
      });
      throw error;
    }
  }
}
