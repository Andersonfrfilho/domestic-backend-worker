/**
 * AMQP helper — publica mensagens no RabbitMQ para os flow tests do worker.
 *
 * Usa amqplib diretamente (sem NestJS) para simular os publishers (API/Cron).
 */
import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://zolve:zolve123@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? 'zolve.events';

export async function publishEvent(routingKey: string, payload: unknown): Promise<void> {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();

  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    contentType: 'application/json',
    persistent: true,
  });

  await ch.close();
  await conn.close();
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
