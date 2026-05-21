import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MetricsModule } from '@modules/metrics/metrics.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import { ProviderVerificationLog } from '@modules/shared/providers/database/entities/provider-verification-log.entity';
import { ProviderVerification } from '@modules/shared/providers/database/entities/provider-verification.entity';

import { ProviderApprovalConsumer } from './provider-approval.consumer';
import { ProviderApprovalHandler } from './provider-approval.handler';

@Module({
  imports: [
    MetricsModule,
    TypeOrmModule.forFeature(
      [ProviderVerification, ProviderVerificationLog],
      CONNECTIONS_NAMES.POSTGRES,
    ),
    NotificationModule,
  ],
  providers: [ProviderApprovalHandler, ProviderApprovalConsumer],
})
export class ProviderApprovalModule {}
