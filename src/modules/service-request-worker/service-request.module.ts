import { Module } from '@nestjs/common';

import { MetricsModule } from '@modules/metrics/metrics.module';
import { NotificationModule } from '@modules/notification/notification.module';

import { ServiceRequestConsumer } from './service-request.consumer';
import { ServiceRequestHandler } from './service-request.handler';

@Module({
  imports: [MetricsModule, NotificationModule],
  providers: [ServiceRequestHandler, ServiceRequestConsumer],
})
export class ServiceRequestWorkerModule {}
