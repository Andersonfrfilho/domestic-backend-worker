import { Test } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { RatingConsumer } from './rating.consumer';
import { RatingHandler } from './rating.handler';

const mockHandler = { handle: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const payload = { review_id: 'rev-1', provider_id: 'prov-1', rating: 5 };

describe('RatingConsumer', () => {
  let consumer: RatingConsumer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RatingConsumer,
        { provide: RatingHandler, useValue: mockHandler },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    consumer = module.get(RatingConsumer);
    jest.clearAllMocks();
  });

  it('delegates to handler.handle and resolves', async () => {
    await consumer.onReviewCreated(payload as any);

    expect(mockHandler.handle).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });

  it('re-throws error from handler to trigger NACK', async () => {
    mockHandler.handle.mockRejectedValueOnce(new Error('query failed'));

    await expect(consumer.onReviewCreated(payload as any)).rejects.toThrow('query failed');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
