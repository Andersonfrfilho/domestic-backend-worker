import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { EmailProviderInterface, SendEmailParams } from './email.interface';

@Injectable()
export class NodemailerProvider implements EmailProviderInterface, OnModuleInit {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: Transporter;

  onModuleInit() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    // Only use auth if credentials are provided (not for local testing with MailPit)
    const config: any = {
      host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
    };

    if (smtpUser || smtpPassword) {
      config.auth = {
        user: smtpUser ?? 'apikey',
        pass: smtpPassword ?? '',
      };
    }

    this.transporter = nodemailer.createTransport(config);
    this.logger.log(
      `SMTP configured: host=${config.host}, port=${config.port}, auth=${!!config.auth}`,
    );
  }

  async send(params: SendEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME ?? 'ZOLVE'}" <${process.env.SMTP_FROM_EMAIL ?? 'noreply@zolve.com.br'}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    this.logger.log(`E-mail sent to ${params.to} — subject: "${params.subject}"`);
  }
}
