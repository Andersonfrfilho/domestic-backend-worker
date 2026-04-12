import { Test } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { ProviderApprovalConsumer } from './provider-approval.consumer';
import { ProviderApprovalHandler } from './provider-approval.handler';

const mockHandler = {
  handleApproved: jest.fn().mockResolvedValue(undefined),
  handleRejected: jest.fn().mockResolvedValue(undefined),
};
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const approvedPayload = { provider_id: 'prov-1', user_id: 'user-1', email: 'p@test.com' };
const rejectedPayload = { provider_id: 'prov-2', user_id: 'user-2', email: 'p2@test.com', reason: 'Docs incompletos' };

describe('ProviderApprovalConsumer', () => {
  let consumer: ProviderApprovalConsumer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProviderApprovalConsumer,
        { provide: ProviderApprovalHandler, useValue: mockHandler },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    consumer = module.get(ProviderApprovalConsumer);
    jest.clearAllMocks();
  });

  describe('onProviderApproved', () => {
    it('delegates to handler.handleApproved and resolves', async () => {
      await consumer.onProviderApproved(approvedPayload as any);

      expect(mockHandler.handleApproved).toHaveBeenCalledWith(approvedPayload);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('re-throws error from handler to trigger NACK', async () => {
      mockHandler.handleApproved.mockRejectedValueOnce(new Error('DB error'));

      await expect(consumer.onProviderApproved(approvedPayload as any)).rejects.toThrow('DB error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('onProviderRejected', () => {
    it('delegates to handler.handleRejected and resolves', async () => {
      await consumer.onProviderRejected(rejectedPayload as any);

      expect(mockHandler.handleRejected).toHaveBeenCalledWith(rejectedPayload);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('re-throws error from handler to trigger NACK', async () => {
      mockHandler.handleRejected.mockRejectedValueOnce(new Error('timeout'));

      await expect(consumer.onProviderRejected(rejectedPayload as any)).rejects.toThrow('timeout');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
