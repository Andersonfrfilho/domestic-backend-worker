import { LOGGER_PROVIDER } from '@adatechnology/nestjs-logger';
import { Inject, Injectable } from '@nestjs/common';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import type { SmsProviderInterface } from '@modules/shared/notification/providers/sms/provider';
import { SHARED_NOTIFICATION_PROVIDER_SMS } from '@modules/shared/notification/providers/sms/tokens';

import type { SmsEvent } from './dtos/sms.event.dto';

@Injectable()
export class SmsHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @Inject(SHARED_NOTIFICATION_PROVIDER_SMS)
    private readonly smsProvider: SmsProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  @TraceMethod()
  async handle(event: SmsEvent): Promise<void> {
    this.logger.info({
      message: 'Sending SMS',
      context: this.logContext,
      params: { to: event.to, template_id: event.template_id },
    });

    // Build SMS message from template
    const message = this.buildMessage(event.template_id, event.variables ?? {});

    await this.smsProvider.send({ to: event.to, message });

    this.logger.info({
      message: 'SMS sent successfully',
      context: this.logContext,
      params: { to: event.to, template_id: event.template_id },
    });
  }

  private buildMessage(templateId: string, variables: Record<string, string>): string {
    // SMS templates are simple text, not HTML like email
    switch (templateId) {
      case 'verification_code_sms':
        return `Seu código de verificação Domestic: ${variables.code}\nVálido por ${variables.expiresIn}.\nNunca compartilhe este código.`;
      default:
        this.logger.warn({
          message: 'Unknown SMS template — sending generic message',
          context: this.logContext,
          params: { template_id: templateId },
        });
        return `Código Domestic: ${variables.code}`;
    }
  }
}
