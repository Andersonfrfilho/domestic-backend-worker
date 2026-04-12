import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { FIREBASE_PROVIDER } from '@modules/shared/firebase/firebase.token';
import type { FirebaseProviderInterface } from '@modules/shared/firebase/firebase.interface';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { PushEvent } from './dtos/push.event.dto';

@Injectable()
export class PushHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @Inject(FIREBASE_PROVIDER)
    private readonly firebase: FirebaseProviderInterface,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  async handle(event: PushEvent): Promise<void> {
    this.logger.info({ message: 'Sending push notification', context: this.logContext, params: { user_id: event.user_id } });

    if (!event.fcm_token) {
      this.logger.warn({ message: 'Push skipped — no FCM token', context: this.logContext, params: { user_id: event.user_id } });
      return;
    }

    await this.firebase.sendPush({
      fcmToken: event.fcm_token,
      title: event.title,
      body: event.body,
      data: event.data,
    });
    this.logger.info({ message: 'Push notification sent successfully', context: this.logContext, params: { user_id: event.user_id } });
  }
}
