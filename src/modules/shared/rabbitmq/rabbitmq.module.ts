import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Logger, Module } from '@nestjs/common';

const logger = new Logger('RabbitMQModule');

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: () => {
        const uri =
          process.env.RABBITMQ_URL ||
          `amqp://${process.env.QUEUE_RABBITMQ_USER || 'guest'}:${process.env.QUEUE_RABBITMQ_PASS || 'guest'}@${process.env.QUEUE_RABBITMQ_HOST || 'localhost'}:${process.env.QUEUE_RABBITMQ_PORT || '5672'}/`;

        if (uri.includes('guest') || uri.includes('localhost')) {
          logger.warn(
            'RabbitMQ configured with default credentials or localhost — verify QUEUE_RABBITMQ_* env vars in production',
          );
        }

        return {
          uri,
          enableControllerDiscovery: true,
          connectionInitOptions: { wait: false, reject: false, timeout: 30000 },
          connectionManagerOptions: { heartbeatIntervalInSeconds: 30, reconnectTimeInSeconds: 5 },
          prefetchCount: Number(process.env.RABBITMQ_PREFETCH ?? 10),
        };
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class WorkerRabbitMQModule {}
