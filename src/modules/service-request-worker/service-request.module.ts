import { Module } from '@nestjs/common';

import { NotificationModule } from '@modules/notification/notification.module';
import { WorkerRabbitMQModule } from '@modules/shared/rabbitmq/rabbitmq.module';

import { ServiceRequestHandler } from './service-request.handler';
import { ServiceRequestConsumer } from './service-request.consumer';

@Module({
  imports: [NotificationModule, WorkerRabbitMQModule],
  providers: [ServiceRequestHandler, ServiceRequestConsumer],
})
export class ServiceRequestWorkerModule {}
