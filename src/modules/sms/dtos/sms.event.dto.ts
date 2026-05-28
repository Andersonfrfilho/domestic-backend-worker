export interface SmsEvent {
  to: string;
  template_id: string;
  variables?: Record<string, string>;
}
