import * as fs from 'fs';
import * as path from 'path';

import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import type { EmailProviderInterface } from '@modules/shared/email/email.interface';
import { EMAIL_PROVIDER } from '@modules/shared/email/email.token';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { EmailEvent } from './dtos/email.event.dto';

const SUBJECTS: Record<string, string> = {
  welcome: 'Bem-vindo à ZOLVE!',
  'verify-email': 'Confirme seu e-mail',
  verification_code: 'Confirme seu e-mail — código de verificação',
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
export class EmailHandler {
  private readonly logContext = `${this.constructor.name}.handle`;
  private readonly templatesDir = path.join(__dirname, 'templates');

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProviderInterface,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @TraceMethod()
  async handle(event: EmailEvent): Promise<void> {
    this.logger.info({
      message: 'Sending email',
      context: this.logContext,
      params: { to: event.to, template_id: event.template_id },
    });

    const subject = SUBJECTS[event.template_id];
    if (!subject) {
      this.logger.warn({
        message: 'Unknown email template — ACK without sending',
        context: this.logContext,
        params: { template_id: event.template_id },
      });
      return;
    }

    const variables = event.variables ?? (event as any).params ?? {};
    const html = this.renderTemplate(event.template_id, variables);
    await this.emailProvider.send({ to: event.to, subject, html });
    this.logger.info({
      message: 'Email sent successfully',
      context: this.logContext,
      params: { to: event.to, template_id: event.template_id },
    });
  }

  private renderTemplate(templateId: string, variables: Record<string, string>): string {
    const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);

    if (!fs.existsSync(templatePath)) {
      this.logger.warn({
        message: 'Template file not found — sending plain text fallback',
        context: this.logContext,
        params: { templatePath },
      });
      return JSON.stringify(variables);
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source);
    return compiled(variables);
  }
}
