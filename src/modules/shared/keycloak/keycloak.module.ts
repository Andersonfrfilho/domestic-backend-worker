import { Module } from '@nestjs/common';

import { ConfigModule } from '@config/config.module';

import { KeycloakAdminProvider } from './keycloak-admin.provider';
import { KEYCLOAK_ADMIN_PROVIDER } from './keycloak.token';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KEYCLOAK_ADMIN_PROVIDER,
      useClass: KeycloakAdminProvider,
    },
  ],
  exports: [KEYCLOAK_ADMIN_PROVIDER],
})
export class KeycloakModule {}
