import { Module } from '@nestjs/common';

import { UserVerificationConsumer } from './user-verification.consumer';
import { UserVerificationHandler } from './user-verification.handler';

@Module({
  providers: [UserVerificationHandler, UserVerificationConsumer],
})
export class UserVerificationModule {}
