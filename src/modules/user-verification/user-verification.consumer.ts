import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { UserEmailVerifiedEvent } from './dtos/user-email-verified.event.dto';
import { UserVerificationHandler } from './user-verification.handler';

@Injectable()
export class UserVerificationConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: UserVerificationHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'user.email.verified',
    queue: 'worker.user.verification',
    queueOptions: { durable: true, arguments: { 'x-dead-letter-exchange': 'zolve.dlx' } },
  })
  async onUserEmailVerified(payload: UserEmailVerifiedEvent): Promise<void> {
    this.logger.info({
      message: '[user.email.verified] Received',
      context: this.logContext,
      params: { keycloak_id: payload.keycloak_id, email_id: payload.email_id },
    });

    try {
      await this.handler.handleEmailVerified(payload);
      this.logger.info({
        message: '[user.email.verified] Done',
        context: this.logContext,
        params: { keycloak_id: payload.keycloak_id },
      });
    } catch (error) {
      this.logger.error({
        message: '[user.email.verified] Failed — will NACK',
        context: this.logContext,
        params: {
          keycloak_id: payload.keycloak_id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }
}
