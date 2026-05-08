import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { NotificationProviderInterface, SendNotificationParams } from '../../providers/notification.provider.interface';

@Injectable()
export class LogSmsProvider implements NotificationProviderInterface {
  readonly channel = 'sms' as const;

  constructor(
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  async send(params: SendNotificationParams): Promise<void> {
    this.logger.info({
      message: `📱 SMS → ${params.to}`,
      context: `${this.constructor.name}.send`,
      params: { to: params.to, subject: params.subject, body: params.body },
    });
  }
}
