import { LOGGER_PROVIDER, runWithContext, extractAmqpContext } from '@adatechnology/nestjs-logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import type { ConsumeMessage } from 'amqplib';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_QUEUES,
} from '@modules/shared/constants/rabbitmq-queues.constant';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { SmsEvent } from './dtos/sms.event.dto';
import { SmsHandler } from './sms.handler';

@Injectable()
export class SmsConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: SmsHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: RABBITMQ_QUEUES.NOTIFICATIONS.ROUTING_KEYS.SMS,
    queue: RABBITMQ_QUEUES.NOTIFICATIONS.NAME,
  })
  @TraceMethod()
  async onSmsEvent(payload: any, amqpMsg: ConsumeMessage): Promise<void> {
    const { requestId: propagatedId, parentCtx } = extractAmqpContext(amqpMsg);
    const requestId = propagatedId ?? `msg:sms:${Date.now().toString(36)}`;
    return context.with(parentCtx, () =>
      runWithContext({ requestId }, async () => {
        const startTime = Date.now();
        const smsEvent: SmsEvent = payload.body || payload;
        this.logger.info({
          message: '[notifications.sms] Received',
          context: this.logContext,
          params: { to: smsEvent.to, template_id: smsEvent.template_id },
        });

        try {
          await this.handler.handle(smsEvent);
          this.logger.info({
            message: '[notifications.sms] Done',
            context: this.logContext,
            params: { to: smsEvent.to },
          });
          this.metrics.record('worker.notifications', 'success', Date.now() - startTime);
        } catch (error) {
          this.logger.error({
            message: '[notifications.sms] Failed — will NACK',
            context: this.logContext,
            params: { to: smsEvent.to, error: error?.message },
          });
          this.metrics.record('worker.notifications', 'failed', Date.now() - startTime);
          throw error;
        }
      }),
    );
  }
}
