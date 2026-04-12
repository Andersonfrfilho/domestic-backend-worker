import { Test } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { PushConsumer } from './push.consumer';
import { PushHandler } from './push.handler';

const mockHandler = { handle: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const payload = {
  user_id: 'user-1',
  fcm_token: 'fcm-token-abc',
  title: 'Nova solicitação',
  body: 'Diária para 20/04 às 14h',
  data: { type: 'service_request', request_id: 'req-1' },
};

describe('PushConsumer', () => {
  let consumer: PushConsumer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PushConsumer,
        { provide: PushHandler, useValue: mockHandler },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    consumer = module.get(PushConsumer);
    jest.clearAllMocks();
  });

  it('delegates to handler.handle and resolves', async () => {
    await consumer.onPushEvent(payload as any);

    expect(mockHandler.handle).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });

  it('re-throws error from handler to trigger NACK', async () => {
    mockHandler.handle.mockRejectedValueOnce(new Error('FCM error'));

    await expect(consumer.onPushEvent(payload as any)).rejects.toThrow('FCM error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
