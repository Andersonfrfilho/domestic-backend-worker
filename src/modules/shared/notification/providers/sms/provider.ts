export interface SendSmsParams {
  to: string;
  message: string;
}

export interface SmsProviderInterface {
  send(params: SendSmsParams): Promise<void>;
}
