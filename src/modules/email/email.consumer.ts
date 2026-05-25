import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { EmailEvent } from './dtos/email.event.dto';
import { EmailHandler } from './email.handler';

@Injectable()
export class EmailConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: EmailHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'notifications.email',
    queue: 'worker.notifications',
  })
  @TraceMethod()
  async onEmailEvent(payload: EmailEvent): Promise<void> {
    const requestId = `msg:email:${Date.now().toString(36)}`;
    return runWithContext({ requestId }, async () => {
      const startTime = Date.now();
      this.logger.info({
        message: '[notifications.email] Received',
        context: this.logContext,
        params: { to: payload.to, template_id: payload.template_id },
      });

      try {
        await this.handler.handle(payload);
        this.logger.info({
          message: '[notifications.email] Done',
          context: this.logContext,
          params: { to: payload.to },
        });
        this.metrics.record('worker.notifications', 'success', Date.now() - startTime);
      } catch (error) {
        this.logger.error({
          message: '[notifications.email] Failed — will NACK',
          context: this.logContext,
          params: { to: payload.to, error: error?.message },
        });
        this.metrics.record('worker.notifications', 'failed', Date.now() - startTime);
        throw error;
      }
    });
  }
}
