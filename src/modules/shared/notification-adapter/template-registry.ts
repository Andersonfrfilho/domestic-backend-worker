import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

import { Injectable, Logger } from '@nestjs/common';

import { NotificationTemplate } from './adapters/template.types';
import { TemplateStorageInterface } from './template-storage.interface';

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  { slug: 'verification_code', channel: 'email', subject: 'Confirme seu e-mail — código de verificação', body: '', expectedParams: ['code', 'expiresIn', 'name'] },
  { slug: 'verification_code', channel: 'sms', subject: 'Código de verificação', body: 'Domestic: seu código é {{code}}. Válido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'] },
  { slug: 'verification_code', channel: 'whatsapp', subject: 'Código de verificação', body: 'Seu código de verificação Domestic é: *{{code}}*\n\nVálido por {{expiresIn}}.', expectedParams: ['code', 'expiresIn'] },
  { slug: 'welcome', channel: 'email', subject: 'Bem-vindo à Domestic!', body: '', expectedParams: ['name'] },
  { slug: 'default_sms', subject: 'Domestic', body: '{{message}}', expectedParams: ['message'] },
];

/**
 * Gerencia templates de notificação.
 *
 * ⚡️ PARA EXTRAIR COMO MICROSSERVIÇO:
 * - Copiar este arquivo + template.types.ts + template-storage.interface.ts
 * - Adicionar rota HTTP: POST /templates (upsert), GET /templates/:slug
 * - Trocar FileTemplateStorage por MongoTemplateStorage (já existe a interface)
 * - O microsserviço expõe: POST /notifications/send + CRUD /templates
 */
@Injectable()
export class TemplateRegistry implements TemplateStorageInterface {
  private readonly logger = new Logger(TemplateRegistry.name);
  private readonly templatesDir: string;
  private cache: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.templatesDir = path.join(__dirname, '../../email/templates');
    this.loadDefaults();
  }

  private key(slug: string, channel?: string): string {
    return channel ? `${slug}:${channel}` : slug;
  }

  private loadDefaults(): void {
    for (const tpl of DEFAULT_TEMPLATES) {
      this.cache.set(this.key(tpl.slug, tpl.channel), { ...tpl, body: this.resolveBody(tpl) });
    }
    this.logger.log(`Loaded ${this.cache.size} notification templates`);
  }

  private resolveBody(tpl: NotificationTemplate): string {
    if (tpl.body) return tpl.body;

    if (tpl.channel === 'email') {
      const filePath = path.join(this.templatesDir, `${tpl.slug}.hbs`);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      this.logger.warn(`Template file not found: ${filePath}`);
    }

    return tpl.expectedParams?.reduce((acc, p) => acc + ` {{${p}}}`, '') || tpl.body;
  }

  async findBySlug(slug: string, channel?: string): Promise<NotificationTemplate | undefined> {
    return this.cache.get(this.key(slug, channel)) ?? this.cache.get(slug);
  }

  async upsert(template: NotificationTemplate): Promise<void> {
    this.cache.set(this.key(template.slug, template.channel), template);
    this.logger.log(`Template upserted: ${template.slug} (${template.channel || 'any'})`);
  }

  async getAll(): Promise<NotificationTemplate[]> {
    return Array.from(this.cache.values());
  }

  render(slug: string, variables: Record<string, string | number>, channel?: string): { subject: string; body: string } {
    const tpl = this.cache.get(this.key(slug, channel)) ?? this.cache.get(slug);
    if (!tpl) {
      this.logger.warn(`Template not found: ${slug} (${channel || 'any'})`);
      return { subject: 'Domestic', body: JSON.stringify(variables) };
    }

    const subject = Handlebars.compile(tpl.subject)(variables);
    const body = Handlebars.compile(tpl.body)(variables);
    return { subject, body };
  }
}
