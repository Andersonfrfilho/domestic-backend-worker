import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { extractAmqpContext } from '@modules/shared/rabbitmq/amqp-context.helper';

import type { UserEmailVerifiedEvent } from './dtos/user-email-verified.event.dto';
import { UserVerificationHandler } from './user-verification.handler';

@Injectable()
export class UserVerificationConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: UserVerificationHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'user.email.verified',
    queue: 'worker.user.verification',
  })
  @TraceMethod()
  async onUserEmailVerified(
    payload: UserEmailVerifiedEvent,
    amqpMsg: ConsumeMessage,
  ): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:user-verification:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
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
          this.metrics.record('worker.user.verification', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[user.email.verified] Failed — will NACK',
            context: this.logContext,
            params: {
              keycloak_id: payload.keycloak_id,
              error: error instanceof Error ? error.message : String(error),
            },
          });
          this.metrics.record('worker.user.verification', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }
}
