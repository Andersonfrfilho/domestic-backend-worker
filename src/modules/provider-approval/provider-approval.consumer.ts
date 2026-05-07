import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { ProviderApprovalEvent } from './dtos/provider-approval.event.dto';
import { ProviderApprovalHandler } from './provider-approval.handler';

@Injectable()
export class ProviderApprovalConsumer {
  private readonly logContext = `${this.constructor.name}.consume`;

  constructor(
    private readonly handler: ProviderApprovalHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'provider.approved',
    queue: 'worker.provider.approval',
  })
  async onProviderApproved(payload: ProviderApprovalEvent): Promise<void> {
    this.logger.info({
      message: '[provider.approved] Received',
      context: this.logContext,
      params: { provider_id: payload.provider_id },
    });
    try {
      await this.handler.handleApproved(payload);
      this.logger.info({
        message: '[provider.approved] Done',
        context: this.logContext,
        params: { provider_id: payload.provider_id },
      });
    } catch (error) {
      this.logger.error({
        message: '[provider.approved] Failed — will NACK',
        context: this.logContext,
        params: { provider_id: payload.provider_id, error: error?.message },
      });
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'zolve.events',
    routingKey: 'provider.rejected',
    queue: 'worker.provider.approval',
  })
  async onProviderRejected(payload: ProviderApprovalEvent): Promise<void> {
    this.logger.info({
      message: '[provider.rejected] Received',
      context: this.logContext,
      params: { provider_id: payload.provider_id },
    });
    try {
      await this.handler.handleRejected(payload);
      this.logger.info({
        message: '[provider.rejected] Done',
        context: this.logContext,
        params: { provider_id: payload.provider_id },
      });
    } catch (error) {
      this.logger.error({
        message: '[provider.rejected] Failed — will NACK',
        context: this.logContext,
        params: { provider_id: payload.provider_id, error: error?.message },
      });
      throw error;
    }
  }
}
