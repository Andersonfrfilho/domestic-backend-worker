import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitBindingsService implements OnModuleInit {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    this.setupBindingsWithRetry();
  }

  private setupBindingsWithRetry() {
    let retries = 0;
    const maxRetries = 60;
    const interval = setInterval(() => {
      try {
        const channel = this.amqpConnection.managedChannel;
        if (channel) {
          clearInterval(interval);
          channel.addSetup((ch: ConfirmChannel): void => {
            this.createBindings(ch).catch((error) => {
              console.error('[RabbitBindingsService] Failed to create queue bindings:', error);
            });
          });
          return;
        }

        retries++;
        if (retries > maxRetries) {
          clearInterval(interval);
          console.warn(
            '[RabbitBindingsService] RabbitMQ channel not available after 60 seconds, bindings setup skipped',
          );
        }
      } catch (error) {
        console.error('[RabbitBindingsService] Error in binding setup retry loop:', error);
        clearInterval(interval);
      }
    }, 1000);
  }

  private async createBindings(channel: ConfirmChannel) {
    const bindings = [
      {
        queue: 'worker.provider.approval',
        exchange: 'zolve.events',
        routingKey: 'provider.approved',
      },
      {
        queue: 'worker.provider.approval',
        exchange: 'zolve.events',
        routingKey: 'provider.rejected',
      },
      { queue: 'worker.rating', exchange: 'zolve.events', routingKey: 'review.created' },
      {
        queue: 'worker.service-requests',
        exchange: 'zolve.events',
        routingKey: 'service_request.*',
      },
      {
        queue: 'worker.notifications',
        exchange: 'zolve.events',
        routingKey: 'notifications.email',
      },
      { queue: 'worker.notifications', exchange: 'zolve.events', routingKey: 'notifications.push' },
      { queue: 'worker.dlq', exchange: 'zolve.dlx', routingKey: '' },
    ];

    // Ensure all queues exist
    const queueNames = new Set(bindings.map((b) => b.queue));
    for (const queueName of queueNames) {
      try {
        const queueOptions = queueName === 'worker.dlq' ? { deadLetterExchange: 'zolve.dlx' } : {};
        await channel.assertQueue(queueName, queueOptions);
      } catch (error) {
        console.error(`[RabbitBindingsService] Failed to create queue "${queueName}":`, error);
        throw error;
      }
    }

    // Bind queues to exchanges
    for (const binding of bindings) {
      try {
        await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
      } catch (error) {
        console.error(
          `[RabbitBindingsService] Failed to bind queue "${binding.queue}" to exchange "${binding.exchange}":`,
          error,
        );
        throw error;
      }
    }
  }
}
