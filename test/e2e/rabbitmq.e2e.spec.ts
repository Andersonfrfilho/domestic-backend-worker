/**
 * RabbitMQ Connectivity E2E
 *
 * Verifica que o worker consegue se conectar ao RabbitMQ e que as exchanges/queues
 * esperadas existem na topologia. Requer RabbitMQ rodando.
 *
 * Env: .env.e2e
 */
import * as amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://zolve:zolve123@localhost:5672';

describe('RabbitMQ Connectivity (E2E)', () => {
  let conn: amqplib.ChannelModel;
  let ch: amqplib.Channel;

  beforeAll(async () => {
    conn = await amqplib.connect(RABBITMQ_URL);
    ch = await conn.createChannel();
  });

  afterAll(async () => {
    await ch.close();
    await conn.close();
  });

  it('connects to RabbitMQ successfully', () => {
    expect(conn).toBeDefined();
  });

  it('main exchange zolve.events is reachable (topic, durable)', async () => {
    await expect(
      ch.assertExchange('zolve.events', 'topic', { durable: true }),
    ).resolves.toBeDefined();
  });

  it('DLX exchange zolve.dlx is reachable (fanout, durable)', async () => {
    await expect(
      ch.assertExchange('zolve.dlx', 'fanout', { durable: true }),
    ).resolves.toBeDefined();
  });

  it('worker queues are declared', async () => {
    const queues = [
      'worker.provider.approval',
      'worker.rating',
      'worker.service-requests',
      'worker.notifications',
      'worker.dlq',
    ];
    for (const queue of queues) {
      await expect(
        ch.assertQueue(queue, { durable: true }),
      ).resolves.toBeDefined();
    }
  });
});
