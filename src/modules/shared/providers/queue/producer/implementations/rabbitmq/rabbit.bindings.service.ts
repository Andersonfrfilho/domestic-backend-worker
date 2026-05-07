import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitBindingsService implements OnModuleInit {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    try {
      console.log('🔗 Setting up RabbitMQ bindings on module init...');

      // Hook into connection events for debugging
      const conn = this.amqpConnection.managedConnection;
      if (conn) {
        conn.on('connect', () => console.log('[RMQ-EVENT] ✅ managedConnection CONNECT'));
        conn.on('disconnect', (params: any) =>
          console.log(
            '[RMQ-EVENT] ❌ managedConnection DISCONNECT',
            params?.err?.message || params?.err,
          ),
        );
        conn.on('connectFailed', (err: any) =>
          console.log('[RMQ-EVENT] ⚠️ managedConnection CONNECT_FAILED', err?.message || err),
        );
        conn.on('blocked', (reason: any) =>
          console.log('[RMQ-EVENT] 🔒 managedConnection BLOCKED', reason),
        );
        conn.on('unblocked', () => console.log('[RMQ-EVENT] 🔓 managedConnection UNBLOCKED'));
      }

      // Schedule binding setup with retry strategy
      this.setupBindingsWithRetry();
    } catch (error) {
      console.error('❌ Error in RabbitBindingsService.onModuleInit:', error);
    }
  }

  private setupBindingsWithRetry() {
    let retries = 0;
    const maxRetries = 60;
    const interval = setInterval(() => {
      try {
        const channel = this.amqpConnection.managedChannel;
        if (channel) {
          clearInterval(interval);
          console.log('🔧 managedChannel available, registering addSetup...');

          // The critical part: addSetup with robust error handling
          channel.addSetup((ch: ConfirmChannel): void => {
            console.log('🚀 addSetup callback registered - Creating bindings asynchronously...');
            // Fire and forget with error logging
            this.createBindings(ch).catch((setupError) => {
              console.error('❌ CRITICAL: Error in addSetup callback:', setupError);
            });
          });
          console.log('✅ addSetup registered successfully');
          return;
        }

        retries++;
        if (retries % 10 === 0) {
          console.log(`[RMQ-RETRY] Waiting for managedChannel... (${retries}s)`);
        }

        if (retries > maxRetries) {
          clearInterval(interval);
          console.warn('⚠️ RabbitMQ channel not available after 60 seconds, bindings skipped');
        }
      } catch (error) {
        console.error('❌ Error in binding setup retry loop:', error);
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

    for (const binding of bindings) {
      try {
        console.log(`  Binding: ${binding.queue} <- ${binding.exchange}::${binding.routingKey}`);
        await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
      } catch (error) {
        console.error(`  ❌ Failed to bind ${binding.queue}:`, error);
        throw error;
      }
    }
  }
}
