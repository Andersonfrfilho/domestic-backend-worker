import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface NotificationTemplate {
  slug: string;
  channel: string;
  subject: string;
  content: string;
  expectedParams: string[];
  version: number;
}

const SEED_TEMPLATES: NotificationTemplate[] = [
  { slug: 'verification_code', channel: 'email', subject: 'Confirme seu e-mail', content: '', expectedParams: ['code', 'expiresIn', 'name'], version: 1 },
  { slug: 'verification_code', channel: 'sms', subject: 'Código de verificação', content: 'Domestic: seu código é {{code}}. Válido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'], version: 1 },
  { slug: 'verification_code', channel: 'whatsapp', subject: 'Código de verificação', content: 'Seu código de verificação Domestic é: *{{code}}*\nVálido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'], version: 1 },
  { slug: 'welcome', channel: 'email', subject: 'Bem-vindo à Domestic!', content: '', expectedParams: ['name'], version: 1 },
];

@Injectable()
export class TemplateRepository implements OnModuleInit {
  private readonly logger = new Logger(TemplateRepository.name);
  private collection: any = null;

  async onModuleInit(): Promise<void> {
    try {
      const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/backend_database_mongo';
      const { MongoClient } = await import('mongodb');
      const client = await MongoClient.connect(uri);
      this.collection = client.db().collection('notification_templates');
      await this.collection.createIndex({ slug: 1, channel: 1 }, { unique: true });
      await this.seed();
      this.logger.log('Template repository ready (MongoDB)');
    } catch (err: any) {
      this.logger.warn(`MongoDB unavailable, using defaults: ${err.message}`);
    }
  }

  private async seed(): Promise<void> {
    if (!this.collection) return;
    for (const tpl of SEED_TEMPLATES) {
      await this.collection.updateOne(
        { slug: tpl.slug, channel: tpl.channel },
        { $setOnInsert: tpl },
        { upsert: true },
      );
    }
  }

  async find(slug: string, channel: string): Promise<NotificationTemplate | null> {
    if (this.collection) {
      const fromDb = await this.collection.findOne({ slug, channel });
      if (fromDb) return fromDb;
    }
    return SEED_TEMPLATES.find((t) => t.slug === slug && t.channel === channel) ?? null;
  }

  async upsert(slug: string, channel: string, data: Partial<NotificationTemplate>): Promise<void> {
    if (!this.collection) return;
    await this.collection.updateOne(
      { slug, channel },
      { $set: data, $inc: { version: 1 } },
      { upsert: true },
    );
  }
}
