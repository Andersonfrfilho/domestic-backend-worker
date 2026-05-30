import { LOGGER_PROVIDER } from '@adatechnology/nestjs-logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { NotificationHandler } from '@modules/notification/notification.handler';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';
import { Email } from '@modules/shared/providers/database/entities/email.entity';
import { UserEmail } from '@modules/shared/providers/database/entities/user-email.entity';
import { User } from '@modules/shared/providers/database/entities/user.entity';

import type { ProviderRegisteredEvent } from './dtos/provider-registered.event.dto';

@Injectable()
export class ProviderRegisteredHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @InjectRepository(User, CONNECTIONS_NAMES.POSTGRES)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserEmail, CONNECTIONS_NAMES.POSTGRES)
    private readonly userEmailRepo: Repository<UserEmail>,
    @InjectRepository(Email, CONNECTIONS_NAMES.POSTGRES)
    private readonly emailRepo: Repository<Email>,
    private readonly amqp: AmqpConnection,
    private readonly notificationHandler: NotificationHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @TraceMethod()
  async handle(event: ProviderRegisteredEvent): Promise<void> {
    this.logger.info({
      message: 'Processing user.registered.provider event',
      context: this.logContext,
      params: { userId: event.userId, providerProfileId: event.providerProfileId },
    });

    await this.notificationHandler.persist({
      user_id: event.userId,
      message: 'Bem-vindo ao Cawme! Seu perfil de prestador foi criado com sucesso.',
      metadata: {
        event_type: 'user.registered.provider',
        entity_id: event.providerProfileId,
        entity_type: 'provider',
      },
    });

    const emailAddress = await this.resolveUserEmail(event.userId);
    if (emailAddress) {
      this.amqp
        .publish('zolve.events', 'notifications.email', {
          to: emailAddress,
          template_id: 'provider-welcome',
          variables: { provider_id: event.providerProfileId },
        })
        .catch((error) =>
          this.logger.error({
            message: 'Failed to publish welcome email event',
            context: this.logContext,
            params: { userId: event.userId, error: error?.message },
          }),
        );
    }

    this.logger.info({
      message: 'user.registered.provider processed successfully',
      context: this.logContext,
      params: { userId: event.userId },
    });
  }

  private async resolveUserEmail(userId: string): Promise<string | null> {
    try {
      const userEmail = await this.userEmailRepo.findOne({
        where: { userId, isPrimary: true },
      });
      if (!userEmail) return null;

      const emailRecord = await this.emailRepo.findOne({ where: { id: userEmail.emailId } });
      return emailRecord?.email ?? null;
    } catch {
      return null;
    }
  }
}
