export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface SendNotificationParams {
  to: string;
  subject: string;
  body: string;
  channel: NotificationChannel;
}

export interface NotificationProviderInterface {
  readonly channel: NotificationChannel;
  send(params: SendNotificationParams): Promise<void>;
}
