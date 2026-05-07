import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Logger, Module } from '@nestjs/common';

const logger = new Logger('RabbitMQModule');

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: () => {
        logger.log('🐰 Initializing RabbitMQ connection...');

        // Log cada variável de ambiente para diagnóstico
        logger.log(`📋 RABBITMQ_URL: ${process.env.RABBITMQ_URL ?? 'undefined'}`);
        logger.log(
          `📋 QUEUE_RABBITMQ_USER: ${process.env.QUEUE_RABBITMQ_USER ?? 'undefined (fallback: guest)'}`,
        );
        logger.log(
          `📋 QUEUE_RABBITMQ_PASS: ${process.env.QUEUE_RABBITMQ_PASS ? '****' : 'undefined (fallback: guest)'}`,
        );
        logger.log(
          `📋 QUEUE_RABBITMQ_HOST: ${process.env.QUEUE_RABBITMQ_HOST ?? 'undefined (fallback: localhost)'}`,
        );
        logger.log(
          `📋 QUEUE_RABBITMQ_PORT: ${process.env.QUEUE_RABBITMQ_PORT ?? 'undefined (fallback: 5672)'}`,
        );

        const uri =
          process.env.RABBITMQ_URL ||
          `amqp://${process.env.QUEUE_RABBITMQ_USER || 'guest'}:${process.env.QUEUE_RABBITMQ_PASS || 'guest'}@${process.env.QUEUE_RABBITMQ_HOST || 'localhost'}:${process.env.QUEUE_RABBITMQ_PORT || '5672'}/`;

        logger.log(`🔗 Resolved URI: ${uri.replace(/:\w+@/, ':****@')}`);

        if (uri.includes('guest') || uri.includes('localhost')) {
          logger.warn(
            '⚠️ ATENÇÃO: RabbitMQ usando credenciais padrão ou localhost! Verifique env vars.',
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
