export type NotificationType = 'sms' | 'whatsapp' | 'telegram';

export interface SendNotificationParams {
  to: string;
  message: string;
  type: NotificationType;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface NotificationProviderInterface {
  send(params: SendNotificationParams): Promise<void>;
}
