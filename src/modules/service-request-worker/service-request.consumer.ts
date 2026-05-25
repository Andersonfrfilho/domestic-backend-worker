import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import { QueueMetricsService } from '@modules/metrics/queue-metrics.service';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { ServiceRequestEvent } from './dtos/service-request.event.dto';
import { ServiceRequestHandler } from './service-request.handler';

@Injectable()
export class ServiceRequestConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: ServiceRequestHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
    private readonly metrics: QueueMetricsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'service_request.*',
    queue: 'worker.service-requests',
  })
  @TraceMethod()
  async onServiceRequestEvent(payload: ServiceRequestEvent): Promise<void> {
    const requestId = `msg:service-request:${Date.now().toString(36)}`;
    return runWithContext({ requestId }, async () => {
      const startTime = Date.now();
      this.logger.info({
        message: '[service_request.*] Received',
        context: this.logContext,
        params: { event_type: payload.event_type, request_id: payload.request_id },
      });
      try {
        await this.handler.handle(payload);
        this.logger.info({
          message: '[service_request.*] Done',
          context: this.logContext,
          params: { request_id: payload.request_id },
        });
        this.metrics.record('worker.service-requests', 'success', Date.now() - startTime);
      } catch (error) {
        this.logger.error({
          message: '[service_request.*] Failed — will NACK',
          context: this.logContext,
          params: { request_id: payload.request_id, error: error?.message },
        });
        this.metrics.record('worker.service-requests', 'failed', Date.now() - startTime);
        throw error;
      }
    });
  }
}
