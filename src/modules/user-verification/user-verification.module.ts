import { Module } from '@nestjs/common';

import { MetricsModule } from '@modules/metrics/metrics.module';

import { UserVerificationConsumer } from './user-verification.consumer';
import { UserVerificationHandler } from './user-verification.handler';

@Module({
  imports: [MetricsModule],
  providers: [UserVerificationHandler, UserVerificationConsumer],
})
export class UserVerificationModule {}
