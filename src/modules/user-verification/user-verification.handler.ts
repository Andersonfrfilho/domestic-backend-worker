import {
  KEYCLOAK_ADMIN_CLIENT,
  type KeycloakAdminClientInterface,
} from '@adatechnology/nestjs-keycloak-admin';
import { LOGGER_PROVIDER } from '@adatechnology/nestjs-logger';
import { Inject, Injectable } from '@nestjs/common';

import { TraceMethod } from '@app/shared/decorators/trace-method.decorator';
import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';

import type { UserEmailVerifiedEvent } from './dtos/user-email-verified.event.dto';

@Injectable()
export class UserVerificationHandler {
  private readonly logContext = `${this.constructor.name}.handle`;

  constructor(
    @Inject(KEYCLOAK_ADMIN_CLIENT)
    private readonly keycloakAdmin: KeycloakAdminClientInterface,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  @TraceMethod()
  async handleEmailVerified(event: UserEmailVerifiedEvent): Promise<void> {
    this.logger.info({
      message: 'Processing user email verified event',
      context: this.logContext,
      params: { keycloak_id: event.keycloak_id, email_id: event.email_id, email: event.email },
    });

    try {
      const tokenResult = await this.keycloakAdmin.getAdminToken();
      await this.keycloakAdmin.updateUser({
        userId: event.keycloak_id,
        userData: { emailVerified: true },
        adminToken: tokenResult.accessToken,
      });

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
