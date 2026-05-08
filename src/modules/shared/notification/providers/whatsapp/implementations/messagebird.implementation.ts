import { HTTP_PROVIDER, type HttpProviderInterface } from '@adatechnology/http-client';
import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { WhatsAppProviderInterface, SendWhatsAppParams } from '../provider';

@Injectable()
export class MessageBirdWhatsAppImplementation implements WhatsAppProviderInterface {
  constructor(
    @Inject(HTTP_PROVIDER)
    private readonly httpProvider: HttpProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logProvider: LogProviderInterface,
  ) {}

  async send(params: SendWhatsAppParams): Promise<void> {
    await this.httpProvider.post({
      url: 'https://rest.messagebird.com/whatsapp/messages',
      data: { to: params.to, type: 'text', text: { body: params.message } },
    });

    this.logProvider.info({
      message: `WhatsApp sent to ${params.to}`,
      context: `${this.constructor.name}.send`,
      params: { to: params.to },
    });
  }
}
