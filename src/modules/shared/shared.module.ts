import { Module } from '@nestjs/common';

import { EmailModule } from './email/email.module';
import { FirebaseModule } from './firebase/firebase.module';
import { SmsNotificationModule } from './notification/notification.module';
import { SharedProviderModule } from './providers/provider.module';
import { WorkerRabbitMQModule } from './rabbitmq/rabbitmq.module';

const moduleImports = [SharedProviderModule, EmailModule, FirebaseModule, SmsNotificationModule];
const moduleExports = [SharedProviderModule, EmailModule, FirebaseModule, SmsNotificationModule];

// Only import RabbitMQModule if not explicitly disabled
if (process.env.DISABLE_RABBITMQ !== 'true') {
  moduleImports.push(WorkerRabbitMQModule);
  moduleExports.push(WorkerRabbitMQModule);
}

@Module({
  imports: moduleImports,
  exports: moduleExports,
})
export class SharedModule {}
