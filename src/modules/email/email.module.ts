import { Module } from '@nestjs/common';

import { EmailModule as EmailProviderModule } from '@modules/shared/email/email.module';

import { EmailConsumer } from './email.consumer';
import { EmailHandler } from './email.handler';

@Module({
  imports: [EmailProviderModule],
  providers: [EmailHandler, EmailConsumer],
})
export class EmailModule {}
