import { Module } from '@nestjs/common';

import { SharedInfrastructureProviderQueueProducerImplementationsRabbitMqModule } from './rabbitmq/rabbit.module';
import { QUEUE_PRODUCER_PROVIDER } from '../producer.token';
import { NoopMessageProducer } from './noop/noop.provider';

@Module({
  imports: process.env.DISABLE_RABBITMQ === 'true' ? [] : [SharedInfrastructureProviderQueueProducerImplementationsRabbitMqModule],
  providers: process.env.DISABLE_RABBITMQ === 'true'
    ? [{ provide: QUEUE_PRODUCER_PROVIDER, useClass: NoopMessageProducer }]
    : [],
  exports: process.env.DISABLE_RABBITMQ === 'true' ? [QUEUE_PRODUCER_PROVIDER] : [SharedInfrastructureProviderQueueProducerImplementationsRabbitMqModule],
})
export class SharedInfrastructureProviderQueueProducerImplementationsModule {}
