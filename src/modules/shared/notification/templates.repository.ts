import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

import { Injectable, Logger } from '@nestjs/common';

export interface NotificationTemplate {
  slug: string;
  channel: string;
  subject: string;
  content: string;
  expectedParams: string[];
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  { slug: 'verification_code', channel: 'email', subject: 'Confirme seu e-mail', content: '', expectedParams: ['code', 'expiresIn', 'name'] },
  { slug: 'verification_code', channel: 'sms', subject: 'Código de verificação', content: 'Domestic: seu código é {{code}}. Válido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'] },
  { slug: 'verification_code', channel: 'whatsapp', subject: 'Código de verificação', content: 'Seu código de verificação Domestic é: *{{code}}*\nVálido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'] },
  { slug: 'welcome', channel: 'email', subject: 'Bem-vindo à Domestic!', content: '', expectedParams: ['name'] },
];

@Injectable()
export class NotificationTemplateRepository {
  private readonly logger = new Logger(NotificationTemplateRepository.name);
  private readonly templatesDir = path.join(__dirname, '../providers/mail/implementations');

  async find(slug: string, channel: string): Promise<NotificationTemplate | null> {
    return DEFAULT_TEMPLATES.find((t) => t.slug === slug && t.channel === channel) ?? null;
  }

  render(template: NotificationTemplate, variables: Record<string, string | number>): string {
    if (template.channel === 'email' && !template.content) {
      const filePath = path.join(__dirname, `../../../../email/templates/${template.slug}.hbs`);
      if (fs.existsSync(filePath)) {
        return Handlebars.compile(fs.readFileSync(filePath, 'utf-8'))(variables);
      }
    }
    return Handlebars.compile(template.content)(variables);
  }
}
