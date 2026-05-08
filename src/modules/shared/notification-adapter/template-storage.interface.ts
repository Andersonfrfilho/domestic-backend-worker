import { NotificationTemplate } from './adapters/template.types';

export interface TemplateStorageInterface {
  findBySlug(slug: string, channel?: string): Promise<NotificationTemplate | undefined>;
  upsert(template: NotificationTemplate): Promise<void>;
  getAll(): Promise<NotificationTemplate[]>;
}
