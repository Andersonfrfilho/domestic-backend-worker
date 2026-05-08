import { Injectable } from '@nestjs/common';

import { NotificationAdapterInterface, NotificationChannel, SendNotificationParams, SendNotificationResult } from './notification-adapter.interface';

@Injectable()
export class LogNotificationAdapter implements NotificationAdapterInterface {
  readonly channel: NotificationChannel = 'sms';

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const icons: Record<string, string> = {
      email: '📧',
      sms: '📱',
      whatsapp: '💬',
      push: '🔔',
      telegram: '✈️',
    };
    const icon = icons[params.channel || 'sms'] || '📨';

    console.log(`\n${'━'.repeat(64)}`);
    console.log(`  ${icon}  ${(params.channel || 'sms').toUpperCase()} → ${params.to}`);
    console.log(`  🏷️  Template: ${params.templateId}`);
    console.log(`  📦  Variables: ${JSON.stringify(params.variables, null, 2)}`);
    console.log(`${'━'.repeat(64)}\n`);

    return {
      success: true,
      channel: params.channel || 'sms',
      messageId: `log-${Date.now()}`,
    };
  }
}
