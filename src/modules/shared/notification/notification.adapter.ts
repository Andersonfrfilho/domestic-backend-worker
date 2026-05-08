import { Inject, Injectable } from '@nestjs/common';

import type { MailProviderInterface } from './providers/mail/provider';
import { MailpitMailImplementation } from './providers/mail/implementations/mailpit.implementation';
import type { SmsProviderInterface } from './providers/sms/provider';
import { LogSmsImplementation } from './providers/sms/implementations/log.implementation';
import { MessageBirdSmsImplementation } from './providers/sms/implementations/messagebird.implementation';
import type { WhatsAppProviderInterface } from './providers/whatsapp/provider';
import { MessageBirdWhatsAppImplementation } from './providers/whatsapp/implementations/messagebird.implementation';
import { NotificationTemplateRepository } from './templates.repository';
import { SHARED_NOTIFICATION_PROVIDER_MAIL } from './providers/mail/tokens';
import { SHARED_NOTIFICATION_PROVIDER_SMS } from './providers/sms/tokens';
import { SHARED_NOTIFICATION_PROVIDER_WHATSAPP } from './providers/whatsapp/tokens';

@Injectable()
export class NotificationAdapter {
  private readonly hasMessageBird = !!(process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_API_KEY !== '');

  constructor(
    @Inject(SHARED_NOTIFICATION_PROVIDER_MAIL)
    private readonly mailProvider: MailProviderInterface,
    @Inject(SHARED_NOTIFICATION_PROVIDER_SMS)
    private readonly smsProvider: SmsProviderInterface,
    @Inject(SHARED_NOTIFICATION_PROVIDER_WHATSAPP)
    private readonly whatsAppProvider: WhatsAppProviderInterface,
    private readonly templates: NotificationTemplateRepository,
  ) {}

  async sendEmail(to: string, templateSlug: string, variables: Record<string, string | number>): Promise<void> {
    const template = await this.templates.find(templateSlug, 'email');
    if (!template) throw new Error(`Template not found: ${templateSlug} (email)`);
    const html = this.templates.render(template, variables);
    const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => String(variables[k] ?? ''));
    await this.mailProvider.send({ to, subject, html });
  }

  async sendSms(to: string, templateSlug: string, variables: Record<string, string | number>): Promise<void> {
    const template = await this.templates.find(templateSlug, 'sms');
    if (!template) throw new Error(`Template not found: ${templateSlug} (sms)`);
    const message = this.templates.render(template, variables);
    await this.smsProvider.send({ to, message });
  }

  async sendWhatsApp(to: string, templateSlug: string, variables: Record<string, string | number>): Promise<void> {
    const template = await this.templates.find(templateSlug, 'whatsapp');
    if (!template) throw new Error(`Template not found: ${templateSlug} (whatsapp)`);
    const message = this.templates.render(template, variables);
    await this.whatsAppProvider.send({ to, message });
  }
}
