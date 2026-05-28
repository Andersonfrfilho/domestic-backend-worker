import { Module } from '@nestjs/common';

import { SharedModule } from '@modules/shared/shared.module';

import { SmsConsumer } from './sms.consumer';
import { SmsHandler } from './sms.handler';

@Module({
  imports: [SharedModule],
  providers: [SmsConsumer, SmsHandler],
})
export class SmsModule {}
