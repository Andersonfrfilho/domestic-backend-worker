import { Module } from '@nestjs/common';

import { MetricsModule } from '@modules/metrics/metrics.module';
import { SharedModule } from '@modules/shared/shared.module';

import { SmsConsumer } from './sms.consumer';
import { SmsHandler } from './sms.handler';

@Module({
  imports: [MetricsModule, SharedModule],
  providers: [SmsConsumer, SmsHandler],
})
export class SmsModule {}
