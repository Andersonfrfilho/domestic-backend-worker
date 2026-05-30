import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MetricsModule } from '@modules/metrics/metrics.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import { Email } from '@modules/shared/providers/database/entities/email.entity';
import { UserEmail } from '@modules/shared/providers/database/entities/user-email.entity';
import { User } from '@modules/shared/providers/database/entities/user.entity';

import { ProviderRegisteredConsumer } from './provider-registered.consumer';
import { ProviderRegisteredHandler } from './provider-registered.handler';

@Module({
  imports: [
    MetricsModule,
    TypeOrmModule.forFeature([User, UserEmail, Email], CONNECTIONS_NAMES.POSTGRES),
    NotificationModule,
  ],
  providers: [ProviderRegisteredHandler, ProviderRegisteredConsumer],
})
export class ProviderRegisteredModule {}
