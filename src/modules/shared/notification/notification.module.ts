import { Module } from '@nestjs/common';

import { NotificationAdapter } from './notification.adapter';
import { MailpitMailImplementation } from './providers/mail/implementations/mailpit.implementation';
import { SHARED_NOTIFICATION_PROVIDER_MAIL } from './providers/mail/tokens';
import { LogSmsImplementation } from './providers/sms/implementations/log.implementation';
import { MessageBirdSmsImplementation } from './providers/sms/implementations/messagebird.implementation';
import { SHARED_NOTIFICATION_PROVIDER_SMS } from './providers/sms/tokens';
import { MessageBirdWhatsAppImplementation } from './providers/whatsapp/implementations/messagebird.implementation';
import { SHARED_NOTIFICATION_PROVIDER_WHATSAPP } from './providers/whatsapp/tokens';
import { NotificationTemplateRepository } from './templates.repository';

const hasMessageBird = !!(
  process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_API_KEY !== ''
);

@Module({
  providers: [
    NotificationTemplateRepository,
    { provide: SHARED_NOTIFICATION_PROVIDER_MAIL, useClass: MailpitMailImplementation },
    {
      provide: SHARED_NOTIFICATION_PROVIDER_SMS,
      useClass: hasMessageBird ? MessageBirdSmsImplementation : LogSmsImplementation,
    },
    {
      provide: SHARED_NOTIFICATION_PROVIDER_WHATSAPP,
      useClass: hasMessageBird ? MessageBirdWhatsAppImplementation : LogSmsImplementation,
    },
    NotificationAdapter,
  ],
  exports: [
    NotificationAdapter,
    SHARED_NOTIFICATION_PROVIDER_SMS,
    SHARED_NOTIFICATION_PROVIDER_MAIL,
    SHARED_NOTIFICATION_PROVIDER_WHATSAPP,
  ],
})
export class NotificationModule {}
