import { HTTP_PROVIDER, type HttpProviderInterface } from '@adatechnology/nestjs-http-client';
import { LOGGER_PROVIDER } from '@adatechnology/nestjs-logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { SmsProviderInterface, SendSmsParams } from '../provider';

@Injectable()
export class MessageBirdSmsImplementation implements SmsProviderInterface {
  constructor(
    @Inject(HTTP_PROVIDER)
    private readonly httpProvider: HttpProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logProvider: LogProviderInterface,
  ) {}

  async send(params: SendSmsParams): Promise<void> {
    await this.httpProvider.post({
      url: 'https://rest.messagebird.com/messages',
      data: { recipients: [params.to], originator: 'Domestic', body: params.message },
    });

    this.logProvider.info({
      message: `SMS sent to ${params.to}`,
      context: `${this.constructor.name}.send`,
      params: { to: params.to },
    });
  }
}
