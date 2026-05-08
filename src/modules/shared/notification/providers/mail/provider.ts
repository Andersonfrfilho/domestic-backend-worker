export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface MailProviderInterface {
  send(params: SendEmailParams): Promise<void>;
}
