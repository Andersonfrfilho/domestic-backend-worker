import { Test } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { NotificationHandler } from '@modules/notification/notification.handler';

import { ServiceRequestHandler } from './service-request.handler';

const mockAmqp = { publish: jest.fn().mockResolvedValue(undefined) };
const mockNotification = { persist: jest.fn().mockResolvedValue(undefined) };
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const baseEvent = {
  request_id: 'req-1',
  provider_id: 'prov-1',
  provider_user_id: 'puser-1',
  provider_email: 'provider@test.com',
  provider_fcm_token: 'fcm-prov',
  contractor_id: 'cont-1',
  contractor_user_id: 'cuser-1',
  contractor_email: 'contractor@test.com',
  contractor_fcm_token: 'fcm-cont',
  service_name: 'Diária',
  scheduled_at: '2026-04-20T14:00:00Z',
};

describe('ServiceRequestHandler', () => {
  let handler: ServiceRequestHandler;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceRequestHandler,
        { provide: AmqpConnection, useValue: mockAmqp },
        { provide: NotificationHandler, useValue: mockNotification },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get(ServiceRequestHandler);
    jest.clearAllMocks();
    mockAmqp.publish.mockResolvedValue(undefined);
    mockNotification.persist.mockResolvedValue(undefined);
  });

  it.each(['created', 'accepted', 'rejected', 'completed', 'cancelled'] as const)(
    'handles event_type "%s" and persists notification',
    async (event_type) => {
      await handler.handle({ ...baseEvent, event_type } as any);

      expect(mockNotification.persist).toHaveBeenCalled();
    },
  );

  it('logs warning for unknown event_type without throwing', async () => {
    await handler.handle({ ...baseEvent, event_type: 'unknown' } as any);

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockNotification.persist).not.toHaveBeenCalled();
  });

  it('publishes email event for service_request.created', async () => {
    await handler.handle({ ...baseEvent, event_type: 'created' } as any);

    expect(mockAmqp.publish).toHaveBeenCalledWith(
      'zolve.events',
      'notifications.email',
      expect.objectContaining({ template_id: 'service-request-received' }),
    );
  });

  it('notifies both parties on service_request.completed', async () => {
    await handler.handle({ ...baseEvent, event_type: 'completed' } as any);

    expect(mockNotification.persist).toHaveBeenCalledTimes(2);
  });
});
