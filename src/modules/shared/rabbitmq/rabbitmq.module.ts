import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.RABBITMQ_URL ||
          `amqp://${process.env.QUEUE_RABBITMQ_USER || 'guest'}:${process.env.QUEUE_RABBITMQ_PASS || 'guest'}@${process.env.QUEUE_RABBITMQ_HOST || 'localhost'}:${process.env.QUEUE_RABBITMQ_PORT || '5672'}`,
        exchanges: [
          { name: 'zolve.events', type: 'topic', options: { durable: true } },
          { name: 'zolve.dlx', type: 'fanout', options: { durable: true } },
        ],
        queues: [
          {
            name: 'worker.provider.approval',
            options: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'zolve.dlx',
              },
            },
            bindQueueArguments: {},
          },
          {
            name: 'worker.rating',
            options: {
              durable: true,
              arguments: { 'x-dead-letter-exchange': 'zolve.dlx' },
            },
          },
          {
            name: 'worker.service-requests',
            options: {
              durable: true,
              arguments: { 'x-dead-letter-exchange': 'zolve.dlx' },
            },
          },
          {
            name: 'worker.notifications',
            options: {
              durable: true,
              arguments: { 'x-dead-letter-exchange': 'zolve.dlx' },
            },
          },
          {
            name: 'worker.dlq',
            options: {
              durable: true,
              arguments: {
                'x-message-ttl': 300000,
                'x-max-length': 10000,
              },
            },
          },
        ],
        connectionInitOptions: { wait: false },
        prefetchCount: Number(process.env.RABBITMQ_PREFETCH ?? 10),
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class WorkerRabbitMQModule {}
