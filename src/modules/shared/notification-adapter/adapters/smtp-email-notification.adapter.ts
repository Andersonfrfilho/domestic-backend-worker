import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { EMAIL_PROVIDER } from '@modules/shared/email/email.token';
import type { EmailProviderInterface } from '@modules/shared/email/email.interface';

import { NotificationAdapterInterface, NotificationChannel, SendNotificationParams, SendNotificationResult } from './notification-adapter.interface';

const SUBJECTS: Record<string, string> = {
  welcome: 'Bem-vindo à Domestic!',
  verification_code: 'Confirme seu e-mail',
  'verify-email': 'Confirme seu e-mail',
  'verification-approved': 'Parabéns! Seu perfil foi verificado',
  'verification-rejected': 'Ação necessária no seu cadastro',
  'service-request-received': 'Nova solicitação de serviço',
  'service-request-accepted': 'Sua solicitação foi aceita',
  'service-request-rejected': 'Sua solicitação foi recusada',
  'service-request-completed': 'Serviço concluído — avalie!',
  'service-request-cancelled': 'Solicitação cancelada pelo contratante',
  'request-reminder': 'Você tem uma solicitação pendente',
};

@Injectable()
export class SmtpEmailNotificationAdapter implements NotificationAdapterInterface {
  readonly channel: NotificationChannel = 'email';
  private readonly templatesDir = path.join(__dirname, '../../../email/templates');
  private readonly logContext = `${this.constructor.name}.send`;

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProviderInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const subject = SUBJECTS[params.templateId] || 'Domestic — Notificação';

    const html = this.renderTemplate(params.templateId, params.variables as Record<string, string> || {});

    try {
      await this.emailProvider.send({ to: params.to, subject, html });

      this.logger.info({
        message: `Email sent: ${params.templateId} → ${params.to}`,
        context: this.logContext,
        params: { to: params.to, templateId: params.templateId },
      });

      return { success: true, channel: 'email', messageId: `email-${Date.now()}` };
    } catch (error: any) {
      this.logger.error({
        message: `Email failed: ${params.templateId} → ${params.to}`,
        context: this.logContext,
        params: { to: params.to, templateId: params.templateId, error: error.message },
      });
      return { success: false, channel: 'email', error: error.message };
    }
  }

  private renderTemplate(templateId: string, variables: Record<string, string>): string {
    const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);

    if (!fs.existsSync(templatePath)) {
      this.logger.warn({
        message: `Template not found: ${templateId}`,
        context: this.logContext,
        params: { templateId, path: templatePath },
      });
      return `<p>${JSON.stringify(variables)}</p>`;
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(source)(variables);
  }
}
