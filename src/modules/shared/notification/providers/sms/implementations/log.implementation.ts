import { LOGGER_PROVIDER } from '@adatechnology/nestjs-logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { SmsProviderInterface, SendSmsParams } from '../provider';

@Injectable()
export class LogSmsImplementation implements SmsProviderInterface {
  constructor(
    @Inject(LOGGER_PROVIDER)
    private readonly logProvider: LogProviderInterface,
  ) {}

  async send(params: SendSmsParams): Promise<void> {
    this.logProvider.info({
      message: `📱 SMS → ${params.to}`,
      context: `${this.constructor.name}.send`,
      params: { to: params.to, message: params.message },
    });
  }
}
