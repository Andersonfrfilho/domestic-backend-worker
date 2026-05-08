import { Module, Provider } from '@nestjs/common';

import { EMAIL_PROVIDER } from '@modules/shared/email/email.token';

import { TemplateRegistry } from './template-registry';
import { NotificationAdapterInterface } from './adapters/notification-adapter.interface';
import { LogNotificationAdapter } from './adapters/log-notification.adapter';
import { MessageBirdNotificationAdapter } from './adapters/messagebird-notification.adapter';
import { SmtpEmailNotificationAdapter } from './adapters/smtp-email-notification.adapter';

export const NOTIFICATION_ADAPTERS = 'NOTIFICATION_ADAPTERS';

function createAdapters(): Provider[] {
  const adapters: NotificationAdapterInterface[] = [];
  const providers: Provider[] = [];

  // Email adapter (sempre disponível, usa SMTP)
  providers.push(SmtpEmailNotificationAdapter);

  // SMS/WhatsApp adapter
  if (process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_API_KEY !== '') {
    providers.push(MessageBirdNotificationAdapter);
  } else {
    providers.push(LogNotificationAdapter);
  }

  // Provider que injeta a lista de adapters
  providers.push({
    provide: NOTIFICATION_ADAPTERS,
    useFactory: (...adapterInstances: NotificationAdapterInterface[]) => adapterInstances,
    inject: [SmtpEmailNotificationAdapter, process.env.MESSAGEBIRD_API_KEY ? MessageBirdNotificationAdapter : LogNotificationAdapter],
  });

  return providers;
}

@Module({
  providers: [
    TemplateRegistry,
    ...createAdapters(),
  ],
  exports: [TemplateRegistry, NOTIFICATION_ADAPTERS],
})
export class NotificationAdapterModule {}
