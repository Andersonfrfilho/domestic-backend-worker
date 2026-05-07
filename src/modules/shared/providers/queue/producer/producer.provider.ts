import { Provider } from '@nestjs/common';

import { NoopMessageProducer } from './implementations/noop/noop.provider';
import { RabbitMQMessageProducer } from './implementations/rabbitmq/rabbit.provider';
import { MESSAGE_PRODUCER } from './producer.token';

export const messageProducerProvider: Provider = {
  provide: MESSAGE_PRODUCER,
  useClass: process.env.DISABLE_RABBITMQ === 'true' ? NoopMessageProducer : RabbitMQMessageProducer,
};
