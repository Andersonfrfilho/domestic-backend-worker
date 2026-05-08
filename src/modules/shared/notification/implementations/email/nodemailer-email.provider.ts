import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { NotificationProviderInterface, SendNotificationParams } from '../../providers/notification.provider.interface';

@Injectable()
export class NodemailerEmailProvider implements NotificationProviderInterface, OnModuleInit {
  readonly channel = 'email' as const;
  private readonly logger = new Logger(NodemailerEmailProvider.name);
  private transporter: Transporter;

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'mailpit',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
      auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASSWORD ?? '',
      },
    });
  }

  async send(params: SendNotificationParams): Promise<void> {
    await this.transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Domestic'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@domestic.local'}>`,
      to: params.to,
      subject: params.subject,
      html: params.body,
    });
    this.logger.log(`Email sent to ${params.to} — "${params.subject}"`);
  }
}
