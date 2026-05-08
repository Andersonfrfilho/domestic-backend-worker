import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { NotificationAdapterInterface, NotificationChannel, SendNotificationParams, SendNotificationResult } from './notification-adapter.interface';

@Injectable()
export class MessageBirdNotificationAdapter implements NotificationAdapterInterface {
  readonly channel: NotificationChannel = 'sms';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://rest.messagebird.com';

  constructor(
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {
    this.apiKey = process.env.MESSAGEBIRD_API_KEY || '';
  }

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const channel = params.channel || 'sms';
    const endpoint = channel === 'whatsapp' ? '/whatsapp/messages' : '/messages';

    const body = channel === 'whatsapp'
      ? {
          to: params.to,
          type: 'text',
          text: { body: this.getTemplate(params.templateId, params.variables) },
        }
      : {
          recipients: [params.to],
          originator: 'Domestic',
          body: this.getTemplate(params.templateId, params.variables),
        };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error({
          message: `MessageBird ${channel} failed`,
          context: `${this.constructor.name}.send`,
          params: { to: params.to, templateId: params.templateId, status: response.status, error },
        });
        return { success: false, channel, error };
      }

      const data = await response.json();
      return { success: true, channel, messageId: data.id || String(Date.now()) };
    } catch (error: any) {
      this.logger.error({
        message: `MessageBird ${channel} error`,
        context: `${this.constructor.name}.send`,
        params: { to: params.to, templateId: params.templateId, error: error.message },
      });
      return { success: false, channel, error: error.message };
    }
  }

  private getTemplate(templateId: string, variables?: Record<string, string | number>): string {
    const templates: Record<string, string> = {
      verification_code: 'Seu código de verificação é: {{code}}. Válido por {{expiresIn}}.',
      verification_code_sms: 'Domestic: seu código é {{code}}. Expira em {{expiresIn}}.',
      welcome: 'Bem-vindo à Domestic, {{name}}!',
      default: 'Domestic: {{message}}',
    };

    const template = templates[templateId] || templates.default;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(variables?.[key] ?? `[${key}]`));
  }
}
