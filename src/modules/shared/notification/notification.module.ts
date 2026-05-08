import { Module } from '@nestjs/common';

import { MailpitMailImplementation } from './providers/mail/implementations/mailpit.implementation';
import { LogSmsImplementation } from './providers/sms/implementations/log.implementation';
import { MessageBirdSmsImplementation } from './providers/sms/implementations/messagebird.implementation';
import { MessageBirdWhatsAppImplementation } from './providers/whatsapp/implementations/messagebird.implementation';
import { NotificationAdapter } from './notification.adapter';
import { NotificationTemplateRepository } from './templates.repository';
import { SHARED_NOTIFICATION_PROVIDER_MAIL } from './providers/mail/tokens';
import { SHARED_NOTIFICATION_PROVIDER_SMS } from './providers/sms/tokens';
import { SHARED_NOTIFICATION_PROVIDER_WHATSAPP } from './providers/whatsapp/tokens';

const hasMessageBird = !!(process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_API_KEY !== '');

@Module({
  providers: [
    NotificationTemplateRepository,
    { provide: SHARED_NOTIFICATION_PROVIDER_MAIL, useClass: MailpitMailImplementation },
    { provide: SHARED_NOTIFICATION_PROVIDER_SMS, useClass: hasMessageBird ? MessageBirdSmsImplementation : LogSmsImplementation },
    { provide: SHARED_NOTIFICATION_PROVIDER_WHATSAPP, useClass: hasMessageBird ? MessageBirdWhatsAppImplementation : LogSmsImplementation },
    NotificationAdapter,
  ],
  exports: [NotificationAdapter],
})
export class NotificationModule {}
