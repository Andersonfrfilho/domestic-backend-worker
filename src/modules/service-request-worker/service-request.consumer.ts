import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import { ServiceRequestHandler } from './service-request.handler';
import type { ServiceRequestEvent } from './dtos/service-request.event.dto';

@Injectable()
export class ServiceRequestConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: ServiceRequestHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'service_request.*',
    queue: 'worker.service-requests',
    queueOptions: { durable: true, arguments: { 'x-dead-letter-exchange': 'zolve.dlx' } },
  })
  async onServiceRequestEvent(payload: ServiceRequestEvent): Promise<void> {
    this.logger.info({ message: '[service_request.*] Received', context: this.logContext, params: { event_type: payload.event_type, request_id: payload.request_id } });
    try {
      await this.handler.handle(payload);
      this.logger.info({ message: '[service_request.*] Done', context: this.logContext, params: { request_id: payload.request_id } });
    } catch (error) {
      this.logger.error({ message: '[service_request.*] Failed — will NACK', context: this.logContext, params: { request_id: payload.request_id, error: error?.message } });
      throw error;
    }
  }
}
