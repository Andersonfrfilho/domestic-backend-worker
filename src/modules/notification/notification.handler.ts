import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { Notification } from '@modules/shared/providers/database/entities/notification.entity';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { NotificationPersistEvent } from './dtos/notification-persist.event.dto';

@Injectable()
export class NotificationHandler {
  private readonly logContext = `${this.constructor.name}.persist`;

  constructor(
    @InjectRepository(Notification, CONNECTIONS_NAMES.MONGO)
    private readonly notificationRepo: MongoRepository<Notification>,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  async persist(event: NotificationPersistEvent): Promise<void> {
    this.logger.info({ message: 'Persisting in-app notification', context: this.logContext, params: { user_id: event.user_id, event_type: event.metadata.event_type } });

    const notification = this.notificationRepo.create({
      userId: event.user_id,
      message: event.message,
      type: event.metadata.event_type,
      read: false,
    } as any);

    await this.notificationRepo.save(notification);
    this.logger.info({ message: 'Notification persisted successfully', context: this.logContext, params: { user_id: event.user_id } });
  }
}
