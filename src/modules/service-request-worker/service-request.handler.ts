import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { NotificationHandler } from '@modules/notification/notification.handler';

import type { ServiceRequestEvent } from './dtos/service-request.event.dto';

interface NotifyParams {
  userId: string;
  email: string;
  fcmToken?: string;
  templateId: string;
  emailSubject?: string;
  pushTitle: string;
  pushBody: string;
  variables: Record<string, string>;
  entityId: string;
  eventType: string;
}

@Injectable()
export class ServiceRequestHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly notificationHandler: NotificationHandler,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  async handle(event: ServiceRequestEvent): Promise<void> {
    this.logger.info({ message: 'Processing service request event', context: this.logContext, params: { event_type: event.event_type, request_id: event.request_id } });
    switch (event.event_type) {
      case 'created':
        await this.notifyCreated(event);
        break;
      case 'accepted':
        await this.notifyAccepted(event);
        break;
      case 'rejected':
        await this.notifyRejected(event);
        break;
      case 'completed':
        await this.notifyCompleted(event);
        break;
      case 'cancelled':
        await this.notifyCancelled(event);
        break;
      default:
        this.logger.warn({ message: 'Unknown event_type — skipping', context: this.logContext, params: { event_type: (event as any).event_type } });
        return;
    }
    this.logger.info({ message: 'Service request event processed successfully', context: this.logContext, params: { event_type: event.event_type, request_id: event.request_id } });
  }

  private async notifyCreated(event: ServiceRequestEvent): Promise<void> {
    await this.notify({
      userId: event.provider_user_id,
      email: event.provider_email,
      fcmToken: event.provider_fcm_token,
      templateId: 'service-request-received',
      pushTitle: 'Nova solicitação de serviço',
      pushBody: `${event.service_name} solicitado para ${event.scheduled_at ?? 'data a combinar'}`,
      variables: {
        provider_name: event.provider_email,
        contractor_name: event.contractor_email,
        service_name: event.service_name,
        scheduled_at: event.scheduled_at ?? '',
        request_url: `https://app.zolve.com.br/requests/${event.request_id}`,
      },
      entityId: event.request_id,
      eventType: 'service_request.created',
    });
  }

  private async notifyAccepted(event: ServiceRequestEvent): Promise<void> {
    await this.notify({
      userId: event.contractor_user_id,
      email: event.contractor_email,
      fcmToken: event.contractor_fcm_token,
      templateId: 'service-request-accepted',
      pushTitle: 'Solicitação aceita! ✅',
      pushBody: `${event.service_name} foi aceito pelo prestador`,
      variables: {
        contractor_name: event.contractor_email,
        provider_name: event.provider_email,
        service_name: event.service_name,
        scheduled_at: event.scheduled_at ?? '',
        request_url: `https://app.zolve.com.br/requests/${event.request_id}`,
      },
      entityId: event.request_id,
      eventType: 'service_request.accepted',
    });
  }

  private async notifyRejected(event: ServiceRequestEvent): Promise<void> {
    await this.notify({
      userId: event.contractor_user_id,
      email: event.contractor_email,
      fcmToken: event.contractor_fcm_token,
      templateId: 'service-request-rejected',
      pushTitle: 'Solicitação recusada',
      pushBody: `Sua solicitação de ${event.service_name} foi recusada`,
      variables: {
        contractor_name: event.contractor_email,
        provider_name: event.provider_email,
        service_name: event.service_name,
        app_url: 'https://app.zolve.com.br',
      },
      entityId: event.request_id,
      eventType: 'service_request.rejected',
    });
  }

  private async notifyCompleted(event: ServiceRequestEvent): Promise<void> {
    // Notifica ambos (contratante e prestador)
    await Promise.all([
      this.notify({
        userId: event.contractor_user_id,
        email: event.contractor_email,
        fcmToken: event.contractor_fcm_token,
        templateId: 'service-request-completed',
        pushTitle: 'Serviço concluído ⭐',
        pushBody: `Avalie ${event.service_name}`,
        variables: {
          recipient_name: event.contractor_email,
          service_name: event.service_name,
          review_url: `https://app.zolve.com.br/requests/${event.request_id}/review`,
        },
        entityId: event.request_id,
        eventType: 'service_request.completed',
      }),
      this.notify({
        userId: event.provider_user_id,
        email: event.provider_email,
        fcmToken: event.provider_fcm_token,
        templateId: 'service-request-completed',
        pushTitle: 'Serviço concluído ⭐',
        pushBody: `${event.service_name} foi confirmado pelo contratante`,
        variables: {
          recipient_name: event.provider_email,
          service_name: event.service_name,
          review_url: '',
        },
        entityId: event.request_id,
        eventType: 'service_request.completed',
      }),
    ]);
  }

  private async notifyCancelled(event: ServiceRequestEvent): Promise<void> {
    await this.notify({
      userId: event.provider_user_id,
      email: event.provider_email,
      fcmToken: event.provider_fcm_token,
      templateId: 'service-request-cancelled',
      pushTitle: 'Solicitação cancelada',
      pushBody: `${event.service_name} foi cancelado pelo contratante`,
      variables: {
        provider_name: event.provider_email,
        service_name: event.service_name,
        app_url: 'https://app.zolve.com.br',
      },
      entityId: event.request_id,
      eventType: 'service_request.cancelled',
    });
  }

  private async notify(params: NotifyParams): Promise<void> {
    // Persiste in-app
    await this.notificationHandler.persist({
      user_id: params.userId,
      message: params.pushBody,
      metadata: { event_type: params.eventType, entity_id: params.entityId, entity_type: 'service_request' },
    });

    // Publica e-mail
    this.amqp.publish('zolve.events', 'notifications.email', {
      to: params.email,
      template_id: params.templateId,
      variables: params.variables,
    }).catch((err) => this.logger.error({ message: 'Failed to publish email event', context: this.logContext, params: { user_id: params.userId, error: err?.message } }));

    // Publica push (se tiver token)
    if (params.fcmToken) {
      this.amqp.publish('zolve.events', 'notifications.push', {
        user_id: params.userId,
        fcm_token: params.fcmToken,
        title: params.pushTitle,
        body: params.pushBody,
        data: { type: 'service_request', request_id: params.entityId },
      }).catch((err) => this.logger.error({ message: 'Failed to publish push event', context: this.logContext, params: { user_id: params.userId, error: err?.message } }));
    }
  }
}
