/**
 * Core interface para envio de notificações multicanal.
 * Cada adapter implementa um canal específico (SMS, WhatsApp, Email, Push).
 *
 * Facilmente extraível para um microsserviço independente:
 * - Copiar este diretório
 * - Adicionar um HTTP server (NestJS standalone ou Fastify)
 * - Expor POST /notifications/send
 * - Remover dependências do RabbitMQ se quiser usar HTTP
 */

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'telegram';

export interface SendNotificationParams {
  /** Destinatário (email, telefone com DDI, ID do dispositivo) */
  to: string;
  /** Código do template (ex: verification_code, welcome) */
  templateId: string;
  /** Variáveis para o template Handlebars */
  variables?: Record<string, string | number>;
  /** Canal específico (opcional — se não informado, o adapter decide) */
  channel?: NotificationChannel;
  /** Metadados para rastreamento */
  metadata?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
}

export interface NotificationAdapterInterface {
  /** Nome do canal (ex: 'sms', 'email', 'whatsapp') */
  readonly channel: NotificationChannel;
  /** Envia uma notificação. Deve fazer retry interno em caso de falha. */
  send(params: SendNotificationParams): Promise<SendNotificationResult>;
}
