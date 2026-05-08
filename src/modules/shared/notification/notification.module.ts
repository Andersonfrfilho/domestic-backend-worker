import { Module, Provider } from '@nestjs/common';

import { NOTIFICATION_PROVIDER } from './notification.token';
import { NotificationConsumer } from './notification.consumer';
import { NotificationProviderInterface } from './providers/notification.interface';
import { LogNotificationProvider } from './providers/log.notification.provider';

function createNotificationProvider(): Provider<NotificationProviderInterface> {
  const hasMessageBird = process.env.MESSAGEBIRD_API_KEY && process.env.MESSAGEBIRD_API_KEY !== '';
  if (hasMessageBird) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MessageBirdNotificationProvider } = require('./providers/messagebird.notification.provider');
    return { provide: NOTIFICATION_PROVIDER, useClass: MessageBirdNotificationProvider };
  }
  return { provide: NOTIFICATION_PROVIDER, useClass: LogNotificationProvider };
}

@Module({
  providers: [createNotificationProvider(), NotificationConsumer],
})
export class SmsNotificationModule {}
