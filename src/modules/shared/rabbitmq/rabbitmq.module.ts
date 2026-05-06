import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Logger, Module } from '@nestjs/common';

const logger = new Logger('RabbitMQModule');

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: () => {
        logger.log('Initializing RabbitMQ connection...');
        return {
          uri:
            process.env.RABBITMQ_URL ||
            `amqp://${process.env.QUEUE_RABBITMQ_USER || 'guest'}:${process.env.QUEUE_RABBITMQ_PASS || 'guest'}@${process.env.QUEUE_RABBITMQ_HOST || 'localhost'}:${process.env.QUEUE_RABBITMQ_PORT || '5672'}/`,
          connectionInitOptions: { wait: false },
          prefetchCount: Number(process.env.RABBITMQ_PREFETCH ?? 10),
        };
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class WorkerRabbitMQModule {}
