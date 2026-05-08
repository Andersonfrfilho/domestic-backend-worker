import { HTTP_PROVIDER, type HttpProviderInterface } from '@adatechnology/http-client';
import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { NotificationProviderInterface, SendNotificationParams } from '../../providers/notification.provider.interface';

@Injectable()
export class MessageBirdWhatsAppProvider implements NotificationProviderInterface {
  readonly channel = 'whatsapp' as const;
  private readonly apiKey = process.env.MESSAGEBIRD_API_KEY || '';

  constructor(
    @Inject(HTTP_PROVIDER)
    private readonly httpProvider: HttpProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  async send(params: SendNotificationParams): Promise<void> {
    const response = await this.httpProvider.post({
      url: 'https://rest.messagebird.com/whatsapp/messages',
      data: { to: params.to, type: 'text', text: { body: params.body } },
    });

    if (response.status >= 400) {
      this.logger.error({
        message: `MessageBird WhatsApp failed: ${response.status}`,
        context: `${this.constructor.name}.send`,
        params: { to: params.to, status: response.status },
      });
      throw new Error(`WhatsApp failed: ${response.status}`);
    }

    this.logger.info({
      message: `WhatsApp sent to ${params.to}`,
      context: `${this.constructor.name}.send`,
      params: { to: params.to },
    });
  }
}
