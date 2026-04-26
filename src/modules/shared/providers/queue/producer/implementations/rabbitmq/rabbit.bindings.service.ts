import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

import { AppErrorFactory } from '@modules/error/app.error.factory';
import { MethodNotImplementedErrorCode } from '@modules/error/error-codes';

@Injectable()
export class RabbitBindingsService implements OnModuleInit {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    try {
      const channel = await this.waitForChannel();
      await this.createBindings(channel);
      console.log('✅ RabbitMQ bindings created successfully');
    } catch (error) {
      console.error('❌ Error creating RabbitMQ bindings:', error);
    }
  }

  private async waitForChannel(maxRetries = 30, delayMs = 500): Promise<ConfirmChannel> {
    for (let i = 0; i < maxRetries; i++) {
      const channel = this.amqpConnection.managedChannel?.channel as ConfirmChannel | undefined;
      if (channel) {
        console.log('🔗 RabbitMQ channel available, creating bindings...');
        return channel;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw AppErrorFactory.businessLogic({
      message: 'RabbitMQ channel not available after retries',
      code: MethodNotImplementedErrorCode.METHOD_NOT_IMPLEMENTED,
    });
  }

  private async createBindings(channel: ConfirmChannel) {
    // Worker topology (exchange: zolve.events)
    await channel.bindQueue('worker.provider.approval', 'zolve.events', 'provider.approved');
    await channel.bindQueue('worker.provider.approval', 'zolve.events', 'provider.rejected');
    await channel.bindQueue('worker.rating', 'zolve.events', 'review.created');
    await channel.bindQueue('worker.service-requests', 'zolve.events', 'service_request.*');
    await channel.bindQueue('worker.notifications', 'zolve.events', 'notifications.email');
    await channel.bindQueue('worker.notifications', 'zolve.events', 'notifications.push');

    // DLQ topology (exchange: zolve.dlx)
    await channel.bindQueue('worker.dlq', 'zolve.dlx', '');
  }
}
