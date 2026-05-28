import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_DLX_EXCHANGE,
  RABBITMQ_QUEUES,
} from '@modules/shared/constants/rabbitmq-queues.constant';

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
        queue: RABBITMQ_QUEUES.PROVIDER_APPROVAL.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.PROVIDER_APPROVAL.ROUTING_KEYS.APPROVED,
      },
      {
        queue: RABBITMQ_QUEUES.PROVIDER_APPROVAL.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.PROVIDER_APPROVAL.ROUTING_KEYS.REJECTED,
      },
      {
        queue: RABBITMQ_QUEUES.RATING.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.RATING.ROUTING_KEYS.REVIEW_CREATED,
      },
      {
        queue: RABBITMQ_QUEUES.SERVICE_REQUESTS.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.SERVICE_REQUESTS.ROUTING_KEYS.WILDCARD,
      },
      {
        queue: RABBITMQ_QUEUES.NOTIFICATIONS.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.NOTIFICATIONS.ROUTING_KEYS.EMAIL,
      },
      {
        queue: RABBITMQ_QUEUES.NOTIFICATIONS.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.NOTIFICATIONS.ROUTING_KEYS.SMS,
      },
      {
        queue: RABBITMQ_QUEUES.NOTIFICATIONS.NAME,
        exchange: RABBITMQ_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.NOTIFICATIONS.ROUTING_KEYS.PUSH,
      },
      {
        queue: RABBITMQ_QUEUES.DLQ.NAME,
        exchange: RABBITMQ_DLX_EXCHANGE,
        routingKey: RABBITMQ_QUEUES.DLQ.ROUTING_KEYS.WILDCARD,
      },
    ];

    // Ensure all queues exist
    const queueNames = new Set(bindings.map((b) => b.queue));
    for (const queueName of queueNames) {
      try {
        const queueOptions =
          queueName === RABBITMQ_QUEUES.DLQ.NAME
            ? { deadLetterExchange: RABBITMQ_DLX_EXCHANGE }
            : {};
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
