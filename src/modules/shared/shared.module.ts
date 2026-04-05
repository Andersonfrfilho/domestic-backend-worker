import { Module } from '@nestjs/common';

import { SharedProviderModule } from './providers/provider.module';
import { WorkerRabbitMQModule } from './rabbitmq/rabbitmq.module';
import { EmailModule } from './email/email.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [SharedProviderModule, WorkerRabbitMQModule, EmailModule, FirebaseModule],
  exports: [SharedProviderModule, WorkerRabbitMQModule, EmailModule, FirebaseModule],
})
export class SharedModule {}
