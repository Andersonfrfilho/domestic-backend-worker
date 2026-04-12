import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { ProviderProfile } from '@modules/shared/providers/database/entities/provider-profile.entity';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { ReviewCreatedEvent } from './dtos/review-created.event.dto';

@Injectable()
export class RatingHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @InjectRepository(ProviderProfile, CONNECTIONS_NAMES.POSTGRES)
    private readonly providerRepo: Repository<ProviderProfile>,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  async handle(event: ReviewCreatedEvent): Promise<void> {
    this.logger.info({ message: 'Recalculating average_rating', context: this.logContext, params: { provider_id: event.provider_id, review_id: event.review_id } });

    await this.providerRepo
      .createQueryBuilder()
      .update(ProviderProfile)
      .set({
        averageRating: () =>
          `(SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = '${event.provider_id}')`,
      })
      .where('id = :id', { id: event.provider_id })
      .execute();

    this.logger.info({ message: 'average_rating updated successfully', context: this.logContext, params: { provider_id: event.provider_id } });
  }
}
