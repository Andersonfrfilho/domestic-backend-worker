/**
 * Template de notificação com slug e parâmetros.
 * Pode ser armazenado em arquivo, banco ou serviço externo.
 */
export interface NotificationTemplate {
  /** Slug único do template (ex: verification_code, welcome) */
  slug: string;
  /** Canal a que se aplica (opcional — se vazio, válido para todos) */
  channel?: 'email' | 'sms' | 'whatsapp' | 'push' | 'telegram';
  /** Assunto/título da notificação */
  subject: string;
  /** Corpo do template (Handlebars ou plain text para SMS) */
  body: string;
  /** Parâmetros esperados pelo template (para validação) */
  expectedParams?: string[];
  /** Versão do template */
  version?: string;
}

export interface RenderTemplateParams {
  template: NotificationTemplate;
  variables: Record<string, string | number>;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'telegram';
}

export interface RenderedNotification {
  subject: string;
  body: string;
  channel: string;
}
