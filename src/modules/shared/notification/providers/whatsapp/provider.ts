export interface SendWhatsAppParams {
  to: string;
  message: string;
}

export interface WhatsAppProviderInterface {
  send(params: SendWhatsAppParams): Promise<void>;
}
