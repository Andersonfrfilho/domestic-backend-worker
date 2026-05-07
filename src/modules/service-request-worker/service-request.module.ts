import { Module } from '@nestjs/common';

import { NotificationModule } from '@modules/notification/notification.module';

import { ServiceRequestConsumer } from './service-request.consumer';
import { ServiceRequestHandler } from './service-request.handler';

@Module({
  imports: [NotificationModule],
  providers: [ServiceRequestHandler, ServiceRequestConsumer],
})
export class ServiceRequestWorkerModule {}
