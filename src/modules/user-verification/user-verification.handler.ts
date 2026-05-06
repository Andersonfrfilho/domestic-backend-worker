import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { KeycloakAdminProvider } from '@modules/shared/keycloak/keycloak-admin.provider';
import { KEYCLOAK_ADMIN_PROVIDER } from '@modules/shared/keycloak/keycloak.token';

import type { UserEmailVerifiedEvent } from './dtos/user-email-verified.event.dto';

@Injectable()
export class UserVerificationHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @Inject(KEYCLOAK_ADMIN_PROVIDER)
    private readonly keycloakAdmin: KeycloakAdminProvider,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  async handleEmailVerified(event: UserEmailVerifiedEvent): Promise<void> {
    this.logger.info({
      message: 'Processing user email verified event',
      context: this.logContext,
      params: { keycloak_id: event.keycloak_id, email_id: event.email_id, email: event.email },
    });

    try {
      await this.keycloakAdmin.updateUserEmailVerified(event.keycloak_id, true);
      this.logger.info({
        message: 'Keycloak emailVerified updated successfully',
        context: this.logContext,
        params: { keycloak_id: event.keycloak_id },
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to update Keycloak emailVerified',
        context: this.logContext,
        params: {
          keycloak_id: event.keycloak_id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }
}
