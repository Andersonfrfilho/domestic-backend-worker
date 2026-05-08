import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { MailProviderInterface, SendEmailParams } from '../provider';

@Injectable()
export class MailpitMailImplementation implements MailProviderInterface, OnModuleInit {
  private readonly logger = new Logger(MailpitMailImplementation.name);
  private transporter: Transporter;

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'mailpit',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
    });
  }

  async send(params: SendEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Domestic'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@domestic.local'}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    this.logger.log(`Email sent to ${params.to} — "${params.subject}"`);
  }
}
