import { Test } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { EmailConsumer } from './email.consumer';
import { EmailHandler } from './email.handler';

const mockHandler = { handle: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const payload = {
  to: 'user@test.com',
  template_id: 'service-request-received',
  variables: { provider_name: 'Maria', service_name: 'Diária' },
};

describe('EmailConsumer', () => {
  let consumer: EmailConsumer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmailConsumer,
        { provide: EmailHandler, useValue: mockHandler },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    consumer = module.get(EmailConsumer);
    jest.clearAllMocks();
  });

  it('delegates to handler.handle and resolves', async () => {
    await consumer.onEmailEvent(payload as any);

    expect(mockHandler.handle).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });

  it('re-throws error from handler to trigger NACK', async () => {
    mockHandler.handle.mockRejectedValueOnce(new Error('SMTP error'));

    await expect(consumer.onEmailEvent(payload as any)).rejects.toThrow('SMTP error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
