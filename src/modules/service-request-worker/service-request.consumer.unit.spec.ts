import { Test } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { ServiceRequestConsumer } from './service-request.consumer';
import { ServiceRequestHandler } from './service-request.handler';

const mockHandler = { handle: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const payload = {
  event_type: 'created',
  request_id: 'req-1',
  provider_id: 'prov-1',
  provider_user_id: 'puser-1',
  provider_email: 'p@test.com',
  contractor_id: 'cont-1',
  contractor_user_id: 'cuser-1',
  contractor_email: 'c@test.com',
  service_name: 'Diária',
};

describe('ServiceRequestConsumer', () => {
  let consumer: ServiceRequestConsumer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceRequestConsumer,
        { provide: ServiceRequestHandler, useValue: mockHandler },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    consumer = module.get(ServiceRequestConsumer);
    jest.clearAllMocks();
  });

  it('delegates to handler.handle and resolves', async () => {
    await consumer.onServiceRequestEvent(payload as any);

    expect(mockHandler.handle).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });

  it('re-throws error from handler to trigger NACK', async () => {
    mockHandler.handle.mockRejectedValueOnce(new Error('push failed'));

    await expect(consumer.onServiceRequestEvent(payload as any)).rejects.toThrow('push failed');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
