import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import { ProviderProfile } from '@modules/shared/providers/database/entities/provider-profile.entity';

import { RatingConsumer } from './rating.consumer';
import { RatingHandler } from './rating.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderProfile], CONNECTIONS_NAMES.POSTGRES)],
  providers: [RatingHandler, RatingConsumer],
})
export class RatingModule {}
