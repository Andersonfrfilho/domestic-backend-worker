import { Injectable } from '@nestjs/common';

import { NotificationProviderInterface, SendNotificationParams } from './notification.interface';

@Injectable()
export class LogNotificationProvider implements NotificationProviderInterface {
  async send(params: SendNotificationParams): Promise<void> {
    const prefix = params.type === 'sms' ? '📱 SMS' : params.type === 'whatsapp' ? '💬 WhatsApp' : '✈️ Telegram';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${prefix} → ${params.to}`);
    console.log(`${'-'.repeat(60)}`);
    console.log(`  ${params.message}`);
    if (params.templateId) {
      console.log(`  Template: ${params.templateId}`);
      console.log(`  Variables: ${JSON.stringify(params.variables)}`);
    }
    console.log(`${'='.repeat(60)}\n`);
  }
}
