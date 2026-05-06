import { Module } from '@nestjs/common';

import { KeycloakModule } from '@modules/shared/keycloak/keycloak.module';

import { UserVerificationConsumer } from './user-verification.consumer';
import { UserVerificationHandler } from './user-verification.handler';

@Module({
  imports: [KeycloakModule],
  providers: [UserVerificationHandler, UserVerificationConsumer],
})
export class UserVerificationModule {}
