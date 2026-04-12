import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import { Notification } from '@modules/shared/providers/database/entities/notification.entity';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';

import { NotificationHandler } from './notification.handler';

const mockRepo = {
  create: jest.fn().mockReturnValue({}),
  save: jest.fn().mockResolvedValue({ id: 'notif-1' }),
};
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

const event = {
  user_id: 'user-1',
  message: 'Sua solicitação foi aceita',
  metadata: {
    event_type: 'service_request.accepted',
    entity_id: 'req-1',
    entity_type: 'service_request',
  },
};

describe('NotificationHandler', () => {
  let handler: NotificationHandler;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationHandler,
        { provide: getRepositoryToken(Notification, CONNECTIONS_NAMES.MONGO), useValue: mockRepo },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get(NotificationHandler);
    jest.clearAllMocks();
    mockRepo.create.mockReturnValue({});
    mockRepo.save.mockResolvedValue({ id: 'notif-1' });
  });

  it('creates and saves a notification in MongoDB', async () => {
    await handler.persist(event);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', message: 'Sua solicitação foi aceita', read: false }),
    );
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });
});
