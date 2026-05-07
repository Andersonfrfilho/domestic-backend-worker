import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitBindingsService implements OnModuleInit {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    try {
      console.log('🔗 Setting up RabbitMQ bindings with waitForConnect...');

      // Use waitForConnect to ensure channel is ready
      await this.amqpConnection.managedChannel.waitForConnect(async (channel: ConfirmChannel) => {
        console.log('✅ Channel ready, creating bindings...');
        await this.createBindings(channel);
        console.log('✅ RabbitMQ bindings created successfully');
      });
    } catch (error) {
      console.error('❌ Error creating RabbitMQ bindings:', error);
      // Don't throw, allow app to continue
    }
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
